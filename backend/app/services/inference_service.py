# backend/app/services/inference_service.py
import os
import cv2
import numpy as np
import datetime
from collections import deque
from ultralytics import YOLO
import tensorflow as tf

class InferenceService:
    """
    This service:
      1. Captures frames from the webcam.
      2. Extracts pose keypoints (using a lightweight pose wrapper).
      3. Runs YOLOv8 to get object class histograms.
      4. Concatenates pose + YOLO features into a fixed vector.
      5. Feeds that into a pre-trained autoencoder to compute reconstruction error.
      6. Flags anomalies if error > threshold.
      7. Overlays a red "⚠️ Anomaly" label on the frame when flagged.
      8. Saves a screenshot of every Nth anomalous frame.
      9. Queues a log entry (timestamp, anomaly, error) for the `/logs` endpoint.
     10. Returns JPEG-encoded annotated frames on demand.
    """

    def __init__(
        self,
        yolo_model_path: str = "models/yolov8n.pt",
        autoencoder_path: str = "models/autoencoder.h5",
        anomaly_threshold: float = 0.08220931328833105,
        camera_index: int = 0,
        screenshot_every_n: int = 5,
    ):
        # 1. Load YOLOv8
        self.yolo = YOLO(yolo_model_path)

        # 2. Load Pose model
        from app.services.pose_wrapper import PoseDetector
        self.pose_model = PoseDetector()

        # 3. Load autoencoder
        self.ae = tf.keras.models.load_model(autoencoder_path, compile=False)

        # 4. Load normalization stats
        stats = np.load("models/ae_norm_stats.npz")
        self.mean = stats["mean"]
        self.std  = stats["std"]

        # 4a. Replace any tiny std < eps with eps (avoid dividing by ~0)
        eps = 1e-3
        tiny = (self.std < eps)
        if np.any(tiny):
            print("[InferenceService] ⚠️ replacing tiny std at indices:", np.where(tiny)[0][:10])
            self.std[tiny] = eps

        # Sanity check
        print("[InferenceService] loaded mean.shape =", self.mean.shape, "std.shape =", self.std.shape)
        print("[InferenceService] sample mean[:5] =", self.mean[:5])
        print("[InferenceService] sample std[:5] =", self.std[:5])

        # 5. Set anomaly threshold
        self.threshold = anomaly_threshold
        print(f"[InferenceService] ▶ using anomaly_threshold = {self.threshold:.6f}")

        # 6. How often to save an anomaly screenshot (once every N anomalies)
        self.screenshot_every_n = screenshot_every_n
        self._anomaly_counter = 0

        # 7. Directory for saving anomaly screenshots
        self.screenshot_dir = "data/anomaly_screenshots"
        os.makedirs(self.screenshot_dir, exist_ok=True)

        # 6. OpenCV camera capture (but don’t crash if no device)
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            print("[InferenceService] ⚠️ Warning: camera index "
                  f"{camera_index} could not be opened. "
                  "Running in dummy‐frame mode.")
            self.cap = None
            # We’ll fake a “blank” 640×480 BGR frame
            self.frame_width = 640
            self.frame_height = 480
            self.frame_prev = np.zeros((self.frame_height, self.frame_width, 3), dtype=np.uint8)
            self.frame_curr = self.frame_prev.copy()
        else:
            self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            ret1, self.frame_prev = self.cap.read()
            ret2, self.frame_curr = self.cap.read()
            if not ret1 or not ret2:
                print("[InferenceService] ⚠️ Warning: could not read two initial frames. "
                      "Running in dummy‐frame mode.")
                # fall back to dummy mode
                self.cap.release()
                self.cap = Noneget
                self.frame_width = 640
                self.frame_height = 480
                self.frame_prev = np.zeros((self.frame_height, self.frame_width, 3), dtype=np.uint8)
                self.frame_curr = self.frame_prev.copy()


        # 10. Log queue (most recent 100 inferences)
        self.log_queue = deque(maxlen=100)

        # 11. YOLO class count
        self.num_classes = len(self.yolo.model.names)

        # 12. Feature dimensions
        self.pose_dim    = 18 * 2
        self.feature_dim = self.pose_dim * 2 + self.num_classes

        # 13. Previous pose coords (for velocity)
        self.prev_pose_coords = np.zeros(self.pose_dim, dtype=np.float32)

    def _extract_features(self, frame: np.ndarray):
        """
        Given a BGR frame, returns (feature_vector, yolo_result).
        - feature_vector: concatenated [pose_coords (36), pose_vel (36), class_hist (num_classes)].
        - yolo_result: so that we can draw bounding boxes for visualization.
        """
        # 1) Pose detection
        pose_keypoints = self.pose_model.detect_pose(frame)  # shape (18,2)
        # If any NaN in pose_keypoints, fall back to previous pose
        if np.isnan(pose_keypoints).any():
            print("[InferenceService] ⚠️ Pose returned NaN; using previous pose coords.")
            pose_keypoints = self.prev_pose_coords.reshape(18, 2)

        # 2) Flatten pose coords
        pose_coords = pose_keypoints.reshape(-1)  # (36,)

        # 3) Compute velocity
        pose_vel = pose_coords - self.prev_pose_coords  # (36,)
        self.prev_pose_coords = pose_coords.copy()

        # 4) YOLO histogram
        results = self.yolo(frame, verbose=False)
        class_hist = np.zeros(self.num_classes, dtype=np.float32)
        for cls_idx in results[0].boxes.cls.cpu().numpy().astype(int):
            class_hist[cls_idx] += 1.0
        # Guard against Inf/NaN
        class_hist = np.nan_to_num(class_hist, nan=0.0, posinf=0.0, neginf=0.0)

        # 5) Concatenate
        feature_vector = np.concatenate([pose_coords, pose_vel, class_hist])
        return feature_vector, results[0]

    def _compute_anomaly(self, feature_vector: np.ndarray):
        """
        Normalize the raw feature_vector, run it through the AE, and
        return (is_anomaly: bool, recon_error: float).
        """
        # 1) Debug raw features
        print("[InferenceService] feature_vector[:5] =", feature_vector[:5])

        # 2) Normalize
        x_norm = (feature_vector - self.mean) / self.std

        # 2a) Zero‐out any NaN/Inf
        bad = np.isnan(x_norm) | np.isinf(x_norm)
        if np.any(bad):
            idxs = np.where(bad)[0]
            print("[InferenceService] ❌ x_norm invalid at indices:", idxs[:10], "…")
            x_norm[bad] = 0.0

        # Sanity check
        print("[InferenceService] x_norm[:5] =", x_norm[:5])

        # 3) Prepare for AE
        x_input = x_norm.reshape(1, -1).astype(np.float32)
        if np.isnan(x_input).any():
            print("[InferenceService] ⚠️ x_input still has NaN; applying nan_to_num.")
            x_input = np.nan_to_num(x_input, nan=0.0, posinf=0.0, neginf=0.0)

        # Sanity check
        print("[InferenceService] x_input[0,:5] =", x_input[0,:5])

        # 4) Reconstruct
        x_pred = self.ae.predict(x_input, verbose=False)
        if np.isnan(x_pred).any():
            print("[InferenceService] ⚠️ x_pred has NaN! AE might be corrupted.")

        print("[InferenceService] x_pred[0,:5] =", x_pred[0,:5])

        # 5) Compute MSE
        recon_error = float(np.mean((x_pred - x_input) ** 2))
        return (recon_error > self.threshold), recon_error

    def get_annotated_frame(self):
        """
        1. Read the next frame from camera (or return a dummy frame if no camera).
        2. Extract features + YOLO result.
        3. Compute anomaly.
        4. Overlay a red “⚠️ Anomaly” banner if flagged.
        5. Every Nth anomaly, save a screenshot.
        6. Queue a log entry.
        7. Return JPEG‐encoded annotated frame.
        """
        # ─── Step 1: grab a new frame ───
        if self.cap is not None:
            # real camera mode
            self.frame_prev = self.frame_curr.copy()
            ret, self.frame_curr = self.cap.read()
            if not ret:
                # If the camera suddenly fails mid‐run, fall back to dummy
                print("[InferenceService] ⚠️ Camera read failed; switching to dummy frame mode.")
                self.cap.release()
                self.cap = None
                # fallback: keep frame_curr as a blank frame
                self.frame_curr = np.zeros((self.frame_height, self.frame_width, 3), dtype=np.uint8)
        else:
            # dummy‐frame mode: just shift prev→curr (both blank or last image)
            self.frame_prev = self.frame_curr.copy()
            # frame_curr stays as is (blank or last frame)

        frame = self.frame_curr.copy()

        # 1) Extract features + YOLO result
        feat_vec, yolo_detection = self._extract_features(frame)

        # 2) Compute anomaly
        is_anom, recon_error = self._compute_anomaly(feat_vec)
        print(f"[InferenceService] recon_error = {recon_error:.6f}, is_anom = {is_anom}")

        # 3) Overlay YOLO boxes onto frame
        annotated_frame = yolo_detection.plot()

        # 4) If anomaly, overlay a red banner + “ANOMALY” label
        if is_anom:
            cv2.rectangle(
                annotated_frame,
                (0, 0),
                (self.frame_width, 50),
                (0, 0, 255),
                thickness=-1
            )
            cv2.putText(
                annotated_frame,
                "ANOMALY",
                (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (255, 255, 255),
                2,
            )

            # 5) Screenshot cooldown logic: save only every Nth anomaly
            self._anomaly_counter += 1
            if (self._anomaly_counter % self.screenshot_every_n) == 0:
                ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                fname = f"{ts}_anomaly_{self._anomaly_counter}.jpg"
                save_path = os.path.join(self.screenshot_dir, fname)
                cv2.imwrite(save_path, annotated_frame)
                print(f"[InferenceService] ⚠️ Saved anomaly screenshot → {save_path}")
            else:
                print(
                    f"[InferenceService] anomaly #{self._anomaly_counter}, "
                    f"skipping screenshot until #{self.screenshot_every_n}."
                )

        # 6) Encode to JPEG
        ret2, jpeg = cv2.imencode(".jpg", annotated_frame)
        if not ret2:
            raise RuntimeError("Failed to encode frame to JPEG.")

        # 7) Queue a log entry
        log_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "anomaly": bool(is_anom),
            "recon_error": round(recon_error, 6),
        }
        self.log_queue.appendleft(log_entry)

        # 8) Return the JPEG‐encoded bytes
        return jpeg.tobytes()

    def pop_logs(self):
        """
        Return all queued log entries and clear the queue.
        Format: List of dicts with keys: timestamp, anomaly, recon_error.
        """
        entries = list(self.log_queue)
        self.log_queue.clear()
        return entries

    def release(self):
        """ Release the OpenCV capture. """
        self.cap.release()

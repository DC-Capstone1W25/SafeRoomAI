# backend/app/services/inference_service.py

import os
import cv2
import numpy as np
import datetime
import logging
from collections import deque

import tensorflow as tf
from ultralytics import YOLO

from app.services.video_capture import get_video_source
from app.services.anomaly_metadata import log_anomaly
from app.services.pose_wrapper import PoseDetector

# ── Configure terminal logging ──────────────────────────────────────────────
logger = logging.getLogger("InferenceService")
logger.setLevel(logging.INFO)
if not logger.hasHandlers():
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("[%(asctime)s] %(message)s"))
    logger.addHandler(ch)


class InferenceService:
    def __init__(
        self,
        yolo_model_path: str = "models/yolov8n.pt",
        autoencoder_path: str = "models/autoencoder.h5",
        norm_stats_path: str = "models/ae_norm_stats.npz",
        anomaly_threshold: float = 0.06564145945012571,
        camera_index: int = 0,
        fallback_video: str = "sample.mp4",
    ):
        # ── 1) Load all models & statistics ────────────────────────────────
        self._load_models(yolo_model_path, autoencoder_path, norm_stats_path)
        self.threshold = anomaly_threshold

        # ── 2) Screenshot counters ────────────────────────────────────────
        self._anomaly_counter = 0
        self._last_screenshot_counter = 0
        # interval between screenshots (after the first)
        self.screenshot_interval = 100  
        self.screenshot_dir = "data/anomaly_screenshots"
        os.makedirs(self.screenshot_dir, exist_ok=True)

        # ── 3) Video capture (camera → fallback → error) ────────────────
        self.cap = get_video_source(camera_index, fallback_video)
        self.frame_width  = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        ok1, self.frame_prev = self.cap.read()
        ok2, self.frame_curr = self.cap.read()
        if not (ok1 and ok2):
            raise RuntimeError("Failed to prime frames from video source")

        # ── 4) In-memory log queue for `/logs` endpoint ───────────────
        self.log_queue = deque(maxlen=100)

        # ── 5) Pose/velocity state ─────────────────────────────────────
        self.prev_pose_coords = np.zeros(self.pose_dim, dtype=np.float32)

    def _load_models(self, yolo_path, ae_path, stats_path):
        """Load YOLO, Pose, Autoencoder, and normalization stats."""
        # YOLO
        self.yolo = YOLO(yolo_path)
        self.num_classes = len(self.yolo.model.names)

        # Pose
        self.pose_model = PoseDetector()
        self.pose_dim = 18 * 2
        self.feature_dim = self.pose_dim * 2 + self.num_classes

        # Autoencoder
        self.ae = tf.keras.models.load_model(ae_path, compile=False)

        # Normalization stats
        stats = np.load(stats_path)
        self.mean = stats["mean"]
        self.std  = stats["std"]
        eps = 1e-3
        self.std[self.std < eps] = eps

    def _extract_features(self, frame: np.ndarray):
        """Compute pose keypoints, velocity, YOLO histogram → feature vector."""
        # Pose detection
        pts = self.pose_model.detect_pose(frame).reshape(-1)
        if np.isnan(pts).any():
            pts = self.prev_pose_coords.copy()

        # Velocity
        vel = pts - self.prev_pose_coords
        self.prev_pose_coords = pts.copy()

        # YOLO histogram
        res = self.yolo(frame, verbose=False)[0]
        hist = np.zeros(self.num_classes, dtype=np.float32)
        for c in res.boxes.cls.cpu().numpy().astype(int):
            hist[c] += 1.0

        feat = np.concatenate([pts, vel, hist])
        return feat, res

    def _compute_anomaly(self, feat: np.ndarray):
        """Normalize → autoencode → compute MSE → return (is_anomaly, error)."""
        x = (feat - self.mean) / self.std
        x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)
        x_in = x.reshape(1, -1).astype(np.float32)

        x_pred = self.ae.predict(x_in, verbose=False)
        err = float(np.mean((x_pred - x_in) ** 2))
        return (err > self.threshold), err

    def get_annotated_frame(self) -> bytes:
        """
        1. Grab frame
        2. Extract features + YOLO
        3. Compute anomaly
        4. Log to terminal
        5. Overlay boxes + banner
        6. Screenshot per rules
        7. Persist metadata
        8. Encode JPEG + queue in-memory
        """
        # ── 1) Grab frame ────────────────────────────────────────────────
        ret, frame = self.cap.read()
        if not ret:
            raise RuntimeError("Video source returned no frame")

        # ── 2) Feature extraction & 3) anomaly detection ───────────────
        feat, yolo_res = self._extract_features(frame)
        is_anom, err = self._compute_anomaly(feat)

        # ── 4) Terminal log ────────────────────────────────────────────
        logger.info(f"is_anomaly={is_anom}, recon_error={err:.6f}")

        # ── 5) Draw YOLO boxes ─────────────────────────────────────────
        annotated = yolo_res.plot()

        # ── 6) Anomaly banner + conditional screenshot ───────────────
        if is_anom:
            # red banner
            cv2.rectangle(annotated, (0,0), (self.frame_width, 50), (0,0,255), -1)
            cv2.putText(
                annotated, "ANOMALY", (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255,255,255), 2
            )

            # bump anomaly count
            self._anomaly_counter += 1

            # take screenshot on first anomaly, then every `screenshot_interval`
            if (self._anomaly_counter == 1 or
                (self._anomaly_counter - self._last_screenshot_counter) >= self.screenshot_interval):
                ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                fname = f"{ts}_anom_{self._anomaly_counter}.jpg"
                path = os.path.join(self.screenshot_dir, fname)
                cv2.imwrite(path, annotated)
                logger.info(f"Saved anomaly screenshot → {path}")
                self._last_screenshot_counter = self._anomaly_counter

            # ── 7) Persist metadata ───────────────────────────────────
            frame_index = int(self.cap.get(cv2.CAP_PROP_POS_FRAMES))
            log_anomaly(
                camera_id=f"cam{frame_index}", 
                is_anomaly=is_anom, 
                recon_error=err, 
                bbox={}
                )

        # ── 8) JPEG encode + in-memory log ────────────────────────────
        ok, jpeg = cv2.imencode(".jpg", annotated)
        if not ok:
            raise RuntimeError("JPEG encoding failed")

        self.log_queue.appendleft({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "anomaly":   bool(is_anom),
            "recon_error": round(err, 6),
        })

        return jpeg.tobytes()

    def pop_logs(self):
        """Return & clear the in-memory log queue."""
        entries = list(self.log_queue)
        self.log_queue.clear()
        return entries

    def release(self):
        """Release the video capture device."""
        self.cap.release()

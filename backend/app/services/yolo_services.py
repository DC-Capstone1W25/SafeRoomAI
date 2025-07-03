# backend/app/services/yolo_service.py
import os
from ultralytics import YOLO
import cv2, logging
import numpy as np
from threading import Thread
from app.services.video_capture import get_video_source


class MotionYoloProcessor:
    def __init__(self, model_path: str = "yolov8n.pt", source: int = 0):
        # Load YOLO model
        self.model = YOLO(model_path)
        # OpenCV video capture with fallback
        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        FALLBACK = os.path.join(PROJECT_ROOT, "sample.mp4")
        self.cap = get_video_source(source, fallback_video=FALLBACK)
        self.frame1 = None
        self.frame2 = None
        self._init_frames()

    def _init_frames(self):
        ret1, self.frame1 = self.cap.read()
        ret2, self.frame2 = self.cap.read()
        if not ret1 or not ret2:
            raise RuntimeError("Failed to grab initial frames.")

    def _detect_motion(self):
        """Return (motion_detected: bool, frame_to_process)."""
        diff = cv2.absdiff(self.frame1, self.frame2)
        gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 20, 255, cv2.THRESH_BINARY)
        dilated = cv2.dilate(thresh, None, iterations=3)
        contours, _ = cv2.findContours(
            dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )

        for contour in contours:
            if cv2.contourArea(contour) < 1000:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(self.frame1, (x, y), (x + w, y + h), (0, 255, 0), 2)
            return True, self.frame1

        return False, self.frame1

    def get_annotated_frame(self):
        """Read next frame, run motion detection + YOLO, return JPEG bytes."""
        motion, proc_frame = self._detect_motion()

        if motion:
            results = self.model(proc_frame, verbose=False)
            annotated = results[0].plot()
        else:
            annotated = proc_frame

        # slide window
        self.frame1, self.frame2 = self.frame2, self.cap.read()[1]

        # encode to JPEG
        ret, jpeg = cv2.imencode(".jpg", annotated)
        if not ret:
            raise RuntimeError("Failed to encode frame.")
        return jpeg.tobytes()

    def release(self):
        self.cap.release()

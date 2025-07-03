# app/services/frame_extractor.py

import cv2
from datetime import datetime

def extract_frame(video_path: str, anomaly_ts: datetime, start_ts: datetime, out_path: str):
    """
    - video_path: path to your MP4
    - anomaly_ts: UTC datetime of the anomaly
    - start_ts:  UTC datetime when the video recording began
    """
    offset = (anomaly_ts - start_ts).total_seconds()
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_MSEC, offset * 1000)  # jump to ms into video
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise RuntimeError(f"Unable to read frame at {offset:.3f}s")
    cv2.imwrite(out_path, frame)

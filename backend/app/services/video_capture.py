# backend/app/services/video_capture.py
import cv2, logging
logger = logging.getLogger(__name__)

def get_video_source(camera_index: int, fallback_video: str) -> cv2.VideoCapture:
    cap = cv2.VideoCapture(camera_index)
    if cap.isOpened():
        logger.info(f"[video_capture] using camera #{camera_index}")
        return cap

    logger.warning(f"[video_capture] camera #{camera_index} unavailable – trying '{fallback_video}'")
    cap = cv2.VideoCapture(fallback_video)
    if cap.isOpened():
        logger.info(f"[video_capture] opened fallback video '{fallback_video}'")
        return cap

    logger.error(f"[video_capture] failed to open camera or '{fallback_video}'")
    raise RuntimeError(f"Could not open camera #{camera_index} or video '{fallback_video}'")


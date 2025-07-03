# backend/app/api/predict.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.app.services.inference_service import MotionYoloProcessor  

router = APIRouter()
processor = MotionYoloProcessor(model_path="models/yolov8n.pt", source=0)

def frame_streamer():
    """Generator that yields motion+YOLO-annotated frames as MJPEG."""
    while True:
        frame_bytes = processor.get_annotated_frame()  # JPEG bytes
        # Build a multipart boundary frame
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            frame_bytes +
            b"\r\n"
        )

@router.get(
    "/video", 
    summary="Live motion & YOLO stream", 
    response_class=StreamingResponse
)
def video_feed():
    """
    Streams a multipart MJPEG of annotated frames.
    Clients can point an <img> tag at this URL.
    """
    return StreamingResponse(
        frame_streamer(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
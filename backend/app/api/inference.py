# backend/app/api/inference.py
import os
import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from app.services.inference_service import InferenceService

router = APIRouter()

service = InferenceService(
    yolo_model_path="models/yolov8n.pt",
    autoencoder_path="models/autoencoder.h5",
    anomaly_threshold=0.09952242262661457,
    camera_index=0,
)

def mjpeg_streamer():
    boundary = b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
    try:
        while True:
            frame_bytes = service.get_annotated_frame()
            yield boundary + frame_bytes + b"\r\n"
    except Exception:
        return

@router.get("/video", response_class=StreamingResponse, summary="Live video with anomalies")
def video_feed():
    return StreamingResponse(
        mjpeg_streamer(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

@router.get("/logs", summary="Fetch & clear anomaly logs")
def get_logs():
    try:
        logs = service.pop_logs()
        return JSONResponse(content=logs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity/list", summary="List all anomaly snapshot filenames")
def list_activity():
    """
    Returns a JSON array of filenames under data/anomaly_screenshots whose first
    15 characters can be parsed as YYYYMMDD-HHMMSS.  Sort descending.
    """
    activity_dir = "data/anomaly_screenshots"
    os.makedirs(activity_dir, exist_ok=True)

    valid_files = []
    for fn in os.listdir(activity_dir):
        if not fn.lower().endswith(".jpg"):
            continue

        # attempt to parse the first 15 chars as "%Y%m%d-%H%M%S"
        prefix = fn[:15]  # e.g. "20250530-214523"
        try:
            datetime.datetime.strptime(prefix, "%Y%m%d-%H%M%S")
            valid_files.append(fn)
        except ValueError:
            continue

    valid_files.sort(reverse=True)
    return JSONResponse(content=valid_files)


@router.get("/activity/{filename}", summary="Fetch one anomaly snapshot")
def serve_activity_image(filename: str):
    activity_dir = "data/anomaly_screenshots"
    filepath = os.path.join(activity_dir, filename)
    if os.path.exists(filepath) and filename.lower().endswith(".jpg"):
        return FileResponse(filepath, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="File not found")


@router.get("/analytics/summary", summary="Aggregated anomalies per minute")
def analytics_summary():
    """
    Returns a JSON object where each key is an ISO timestamp (to the minute)
    and the value is the count of anomalies saved under data/anomaly_screenshots
    for that minute.  We parse only the first 15 characters of each filename
    as "%Y%m%d-%H%M%S".
    """
    activity_dir = "data/anomaly_screenshots"
    os.makedirs(activity_dir, exist_ok=True)

    summary = {}
    for fname in os.listdir(activity_dir):
        if not fname.lower().endswith(".jpg"):
            continue

        # take first 15 chars as a timestamp
        prefix = fname[:15]  # e.g. "20250530-214523"
        try:
            dt = datetime.datetime.strptime(prefix, "%Y%m%d-%H%M%S")
        except ValueError:
            continue

        minute_key = dt.replace(second=0, microsecond=0).isoformat()
        summary[minute_key] = summary.get(minute_key, 0) + 1

    return JSONResponse(content=summary)


@router.get("/analytics/errors", summary="List recent reconstruction errors")
def analytics_errors():
    """
    Returns a JSON array of the most recent reconstruction errors.
    We pop logs so that /logs continues to work independently.
    """
    # service.pop_logs clears them, but we only need the recon_error list here:
    logs = service.pop_logs()
    errors = [entry.get("recon_error", 0.0) for entry in logs]
    return JSONResponse(content=errors)

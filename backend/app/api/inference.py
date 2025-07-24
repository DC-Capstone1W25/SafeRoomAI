# backend/app/api/inference.py

import os
import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from app.services.inference_service import InferenceService
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db
from app.services.anomaly_metadata import col  # pymongo collection

router = APIRouter()

service = InferenceService(
    yolo_model_path="models/yolov8n.pt",
    autoencoder_path="models/autoencoder.h5",
    anomaly_threshold=0.06564145945012571,
    camera_index=int(os.getenv("CAMERA_INDEX", -1)),
    fallback_video=os.getenv("FALLBACK_VIDEO", "data/sample.mp4"),
)
router.service = service

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

@router.get("/activity/list", summary="List all anomaly snapshots with metadata")
def list_activity():
    activity_dir = "data/anomaly_screenshots"
    os.makedirs(activity_dir, exist_ok=True)

    entries = []
    for fn in sorted(os.listdir(activity_dir), reverse=True):
        if not fn.lower().endswith(".jpg"):
            continue

        doc = col.find_one({"filename": fn})
        entries.append({
            "filename":    fn,
            "metadata_id": str(doc["_id"])          if doc else None,
            "is_anomaly":  bool(doc["is_anomaly"])  if doc else None,
        })

    return JSONResponse(content=entries)

@router.get("/activity/{filename}", summary="Fetch one anomaly snapshot")
def serve_activity_image(filename: str):
    activity_dir = "data/anomaly_screenshots"
    filepath     = os.path.join(activity_dir, filename)
    if os.path.exists(filepath) and filename.lower().endswith(".jpg"):
        return FileResponse(filepath, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="File not found")

@router.delete("/activity/{filename}", summary="Clear anomaly: delete screenshot & update metadata")
def clear_anomaly(filename: str):
    activity_dir = "data/anomaly_screenshots"
    filepath     = os.path.join(activity_dir, filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    result = col.update_many(
        {"filename": filename},
        {"$set": {"is_anomaly": False}}
    )

    return JSONResponse({
        "success":          True,
        "deleted_file":     not os.path.exists(filepath),
        "metadata_updated": result.modified_count
    })

@router.get("/analytics/summary", summary="Aggregated anomalies per minute")
def analytics_summary():
    activity_dir = "data/anomaly_screenshots"
    os.makedirs(activity_dir, exist_ok=True)

    summary = {}
    for fname in os.listdir(activity_dir):
        if not fname.lower().endswith(".jpg"):
            continue

        prefix = fname[:15]
        try:
            dt = datetime.datetime.strptime(prefix, "%Y%m%d-%H%M%S")
        except ValueError:
            continue

        minute_key = dt.replace(second=0, microsecond=0).isoformat()
        summary[minute_key] = summary.get(minute_key, 0) + 1

    return JSONResponse(content=summary)

@router.get("/analytics/errors", summary="List recent reconstruction errors")
def analytics_errors():
    logs   = service.pop_logs()
    errors = [entry.get("recon_error", 0.0) for entry in logs]
    return JSONResponse(content=errors)

@router.get("/users", summary="Fetch all users from RDS database")
def read_users(db: Session = Depends(get_db)):
    return db.execute("SELECT * FROM users").fetchall()

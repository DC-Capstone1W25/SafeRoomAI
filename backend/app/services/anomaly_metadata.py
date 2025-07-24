# backend/app/services/anomaly_metadata.py

import os
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# ── Load your conf/.env ───────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = Path(os.getenv("ENV_PATH", BASE_DIR / "conf" / ".env"))

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()  # fall back to existing env
    print(f"[warn] .env not found at {ENV_PATH}")

# ── Connect to MongoDB ────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise RuntimeError("Missing MONGODB_URI in environment")

client = MongoClient(MONGO_URI)
db     = client.SafeRoomAI
col    = db.anomaly_metadata

# TTL: expire docs 7 days after their ts
col.create_index([("ts", ASCENDING)], expireAfterSeconds=7 * 24 * 3600)

def log_anomaly(
    camera_id: str,
    is_anomaly: bool,
    recon_error: float,
    bbox: Optional[Dict[str, Any]] = None,
    filename: Optional[str]      = None,
):
    """Insert one anomaly‐metadata document into Mongo."""
    doc = {
        "camera_id":  camera_id,
        "ts":          datetime.utcnow(),
        "is_anomaly":  is_anomaly,
        "recon_err":   recon_error,
        "bbox":        bbox or {},
        "filename":    filename,
    }
    col.insert_one(doc)

def fetch_anomalies(camera_id: str, since: Optional[datetime] = None):
    """Return list of anomaly docs for a given camera_id (optionally ts >= since)."""
    q = {"camera_id": camera_id}
    if since:
        q["ts"] = {"$gte": since}
    return list(col.find(q).sort("ts", ASCENDING))

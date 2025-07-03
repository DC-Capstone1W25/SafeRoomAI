# app/services/anomaly_metadata.py
import os
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

# ── Load your inner conf/.env ────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[3]   # …/SafeRoomAI/SafeRoomAI
ENV_PATH = BASE_DIR / "conf" / ".env"
if not ENV_PATH.exists():
    raise RuntimeError(f"Could not find .env at {ENV_PATH}")
load_dotenv(dotenv_path=str(ENV_PATH))

# ── Connect to MongoDB ───────────────────────────────────────────────
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
    bbox: dict = None
):
    """
    Insert one anomaly‐metadata document into Mongo.
    - camera_id:   ID for your source
    - is_anomaly:  True/False
    - recon_error: autoencoder error
    - bbox:        optional bounding‐box info
    """
    doc = {
        "camera_id":  camera_id,
        "ts":          datetime.utcnow(),
        "is_anomaly":  is_anomaly,
        "recon_err":   recon_error,
        "bbox":        bbox or {},
    }
    col.insert_one(doc)

def fetch_anomalies(camera_id: str, since: datetime = None):
    """
    Return list of anomaly docs for a given camera_id.
    Optionally only those with ts >= since.
    """
    q = {"camera_id": camera_id}
    if since:
        q["ts"] = {"$gte": since}
    return list(col.find(q).sort("ts", ASCENDING))

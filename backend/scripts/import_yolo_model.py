# backend/scripts/import_yolo_model.py

from ultralytics import YOLO
import bentoml
from bentoml.exceptions import NotFound

MODEL_PATH = "models/yolov8n.pt"
MODEL_NAME = "yolov8n"

try:
    bentoml.pytorch.get(f"{MODEL_NAME}:latest")
    print(f"✔️  '{MODEL_NAME}:latest' already in BentoML model store")
except NotFound:
    print(f"🚀  Importing {MODEL_PATH} into BentoML as '{MODEL_NAME}:latest'…")
    yolom = YOLO(MODEL_PATH)
    bentoml.pytorch.save_model(
        MODEL_NAME,
        yolom,
        signatures={"predict": {"batchable": False}},
    )
    print("✅ Done.")

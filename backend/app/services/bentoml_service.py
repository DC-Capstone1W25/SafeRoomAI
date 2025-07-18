# backend/app/services/bentoml_service.py
import base64
import bentoml
from bentoml.exceptions import NotFound
from bentoml.legacy import Runner
from bentoml import service, api
from bentoml.io import JSON
from app.services.yolo_services import MotionYoloProcessor  

MODEL_TAG = "yolov8n:latest" 

# 1️⃣ Load the model
try:
    _model = bentoml.pytorch.get(MODEL_TAG)
except NotFound:
    raise RuntimeError(
        f"Model '{MODEL_TAG}' not found. Run `python scripts/import_yolo_model.py` first."
    )

# 2️⃣ Make it a Runner
_yolo_runner = _model.to_runner()

# 3️⃣ Declare your Service
@service(
    name="safroomai_inference",
    runners=[_yolo_runner],
    external_dependencies={
        "pip": [
            "ultralytics",
            "opencv-python-headless",
            "bentoml>=1.4",
            "fastapi",
            "uvicorn[standard]",
        ]
    },
)
class SafeRoomAIService:
    """Motion + YOLO inference."""

    yolo_runner: Runner = _yolo_runner

    # 4️⃣ Wire up a JSON ➞ JSON endpoint
    @api(input=JSON(), output=JSON(), route="/predict")
    async def predict(self, payload: dict) -> dict:
        """
        Expects {"image_path": "/app/data/foo.jpg"}
        Returns  {"raw_jpeg_bytes": "<base64…>"}
        """
        annotated = await self.yolo_runner.async_run(payload["image_path"])
        encoded = base64.b64encode(annotated).decode("utf-8")
        return {"raw_jpeg_bytes": encoded}
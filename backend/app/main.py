# backend/app/main.py
import uvicorn
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.inference import router as inference_router

app = FastAPI(
    title="SafeRoom AI Anomaly Inference API",
    docs_url=None,            
    redoc_url=None
)

# 1) Mount all of your inference endpoints under /predict
app.include_router(inference_router, prefix="/predict")

# 2) Serve React's build folder
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="frontend")
else:
    os.makedirs(static_path, exist_ok=True)
    app.mount("/", StaticFiles(directory=static_path, html=True), name="frontend")

@app.on_event("shutdown")
def shutdown_event():
    # When Uvicorn shuts down, release the camera
    inference_router.service.release()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)




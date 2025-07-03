######### backend/Dockerfile #########

# ── Stage 1: Build Python backend ────────────────
FROM python:3.9-slim
WORKDIR /app

# 1) OS‐level dependencies (FFmpeg, OpenCV libs, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      libgl1 \
      libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2) Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3) Copy backend source
COPY app    ./app
COPY data   ./data
COPY models ./models
COPY scripts ./scripts

# 4) Expose port & run
EXPOSE 8000
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# SafeRoomAI Backend

This service provides anomaly‐detection APIs powered by FastAPI, Ultralytics YOLO, TensorFlow autoencoder, and MongoDB metadata storage.

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Configuration](#configuration)  
3. [Local Development](#local-development)  
4. [Docker](#docker)  
5. [API Endpoints](#api-endpoints)  
6. [Logging & Monitoring](#logging--monitoring)  
7. [Troubleshooting](#troubleshooting)  

---

## Prerequisites

- Python 3.9+  
- `pip` or `pipenv`  
- MongoDB URI (e.g. Atlas connection string)  
- (Optional) GPU & NVIDIA Docker for faster YOLO inference  

---

## Configuration

1. Copy and edit the env file at the repo root:  
   ```bash
   cp ../conf/.env.example ../conf/.env
   ```  
2. Open `../conf/.env` and set:  
   ```ini
   MONGODB_URI=mongodb+srv://<user>:<pw>@cluster0.mongodb.net/SafeRoomAI
   TZ=America/Toronto
   ```  
3. (Optional) Override via environment:  
   ```bash
   export ENV_PATH=/path/to/conf/.env
   export CAMERA_INDEX=0        # for local webcam
   export FALLBACK_VIDEO=       # disable file fallback
   ```

---

## Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# point to your .env and webcam
export ENV_PATH=../conf/.env
export CAMERA_INDEX=0
export FALLBACK_VIDEO=

# start the API
uvicorn app.main:app   --host 0.0.0.0 --port 8000   --reload
```

## Data Preparation & Model Training

There are three helper scripts under backend/scripts:

- Extract “normal” features
  - Collect pose + YOLO histograms from a clean video (webcam):
```bash
python backend/scripts/extract_normal_features.py
```
  - Outputs `data/normal_features.npy`.

- Train the autoencoder
  - Builds, trains, and saves your TensorFlow autoencoder and normalization stats:
```bash
python backend/scripts/train_autoencoder.py
```
- 
  - Outputs `models/ae_norm_stats.npz` and `models/autoencoder.h5`.
- Compute anomaly threshold
  - Run on your held‐out “normal” features to inspect error distribution and choose a threshold:
```bash
python backend/scripts/compute_threshold.py
```
- 
  - Prints mean/std/percentiles to console.
  - Saves data/val_recon_errors.npy.

- Logs print YOLO & anomaly info to stdout.  
- Mongo metadata stored in collection `SafeRoomAI.anomaly_metadata`.  

---

## Docker

From the repo root:

```bash
docker compose down -v
docker compose up -d --build

# to view logs
docker compose logs -f backend
```

- Loads `../conf/.env` at `/app/conf/.env`  
- Mounts models, data, and code for iteration  
- Exposes port 8000  

---

## API Endpoints

All routes are prefixed with `/predict`:

| Path                          | Method | Description                                  |
|-------------------------------|--------|----------------------------------------------|
| `/predict/video`              | GET    | MJPEG stream of annotated frames             |
| `/predict/logs`               | GET    | Pop & return in‑memory anomaly logs (JSON)   |
| `/predict/activity/list`      | GET    | List anomaly snapshot filenames (JSON array) |
| `/predict/activity/{filename}`| GET    | Download one anomaly snapshot (`.jpg`)       |
| `/predict/analytics/summary`  | GET    | Aggregated counts per minute (JSON)          |
| `/predict/analytics/errors`   | GET    | Recent reconstruction errors (JSON array)    |

---

## Logging & Monitoring

- **Terminal logs** via Python `logging`.  
- **MongoDB TTL index** expires metadata docs after 7 days.  
- **Screenshots** saved under `backend/data/anomaly_screenshots`.  

---

## Troubleshooting

- **`.env not found`**  
  Ensure `ENV_PATH` points to the right file and is mounted in Docker.  
- **Camera errors on macOS**  
  Run backend locally for webcam support, or stream via RTSP into Docker.  
- **Docker volume issues**  
  Check mounts with:  
  ```bash
  docker compose exec backend ls /app/conf /app/data /app/models
  ```  
- **Dependency failures**  
  Verify `requirements.txt` matches your platform (CPU vs GPU).  

---

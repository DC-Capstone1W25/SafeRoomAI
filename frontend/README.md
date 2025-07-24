# SafeRoomAI Frontend

This React application provides the user interface for the SafeRoomAI anomaly monitoring system. It streams live or recorded video, displays anomaly logs, and visualizes activity.

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Configuration](#configuration)  
3. [Local Development](#local-development)  
4. [Docker](#docker)  
5. [Usage](#usage)  
6. [Troubleshooting](#troubleshooting)  

---

## Prerequisites

- **Node.js** v16+  
- **npm** v8+ (or Yarn)  
- A running SafeRoomAI backend at `http://localhost:8000` (for local dev)  

---

## Configuration

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set the backend URL:
   ```ini
   REACT_APP_API_URL=http://localhost:8000
   ```
   > **Note:** The frontend proxy (in development) or Nginx config (in Docker) will forward `/predict/*` calls to this URL.

---

## Local Development

```bash
cd frontend
npm ci
npm start
```

- The app runs on `http://localhost:3000`.  
- The development server proxies API requests (`/predict/*`) to `REACT_APP_API_URL`.  
- Live reload will pick up code changes automatically.

---

## Docker

From the repository root (with `docker-compose.yml` defined):

```bash
docker compose down -v
docker compose up -d --build frontend
```

- The Dockerfile builds the React app (`npm run build`) and serves it via Nginx.  
- Nginx listens on container port 80 and maps host port 3000 to it.  
- Ensure the backend service is available at the address configured in `nginx.conf` (e.g., `http://backend:8000`).

---

## Usage

1. Open your browser to `http://localhost:3000`.  
2. Use the **Source** selector to choose **Camera** or **File**.  
3. For **Camera**, ensure the backend is running with `CAMERA_INDEX=0`.  
4. Monitor the live stream and watch the anomaly logs panel update.  

---

## Troubleshooting

- **Blank Page or 502 Errors**  
  - Verify `REACT_APP_API_URL` matches your backend URL.  
  - In Docker, ensure `frontend/nginx.conf` proxies `/predict/` to the correct backend address (e.g., `http://host.docker.internal:8000`).  
- **Console Errors**  
  - Open browser DevTools (⌥⌘I) → **Console** & **Network** tabs to inspect failures.  
- **CORS Issues**  
  - Development server proxy handles CORS; in production, Nginx should proxy to backend to avoid CORS.  
- **Stale Build**  
  - Remove cached files: `rm -rf node_modules build` then reinstall and rebuild.  

---
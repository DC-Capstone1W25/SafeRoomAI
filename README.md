<p align="center">
  <img src="frontend/public/saferoomai_logo.png" alt="Logo" width="200"/>
</p>

# SafeRoomAI-Showcase 🛡️📹

**A smart surveillance and workplace behavior analytics platform.**

This repository is a **curated portfolio showcase** of my contributions to *SafeRoomAI*, a capstone project developed as part of the AIDI-2005-02 course at Durham College. The goal of the project was to design and build an AI-powered video surveillance system that processes live camera feeds for security and human resource management, using real-time detection, behavioral analytics, and interactive dashboards.

> 💡 Think of it as the "Stripe of AI-powered workplace surveillance and HR analytics."

---

## 🔍 Project Overview

**SafeRoomAI** is a modular, API-first platform that transforms raw surveillance video into structured, actionable intelligence in real time. It supports:

- **Motion and object detection** (e.g., detecting people, vehicles)
  <p align="center">
  <img src="frontend/public/TestingThreshold.png" alt="Logo" width="600"/>
  </p>
- **Facial recognition and action classification** (e.g., loitering, entering restricted areas)
  <p align="center">
  <img src="frontend/public/image (6).png" alt="Logo" width="600"/>
  </p>
- **Anomaly detection** (e.g., off-hour entry, irregular behavior)
  <p align="center">
  <img src="frontend/public/Screenshot 2025-06-10 163358.png" alt="Logo" width="600"/>
  </p>
- **Activity feed interface** for real-time incident monitoring
  <p align="center">
  <img src="frontend/public/Screenshot 2025-07-16 185827.png" alt="Logo" width="600"/>
  </p>
- **Analytics dashboard** for space usage and staff behavior patterns
  <p align="center">
  <img src="frontend/public/Screenshot 2025-07-16 185648.png" alt="Logo" width="600"/>
  </p>

---
## 🧠 Core AI Features

| Feature                     | Technology Used                    | Description |
|----------------------------|-------------------------------------|-------------|
| **Motion/Object Detection** | YOLOv8, OpenCV                     | Real-time detection of people, objects, and vehicles |
| **Face Recognition**        | FaceNet, DeepFace (planned)        | Identify specific employees in footage |
| **Action Recognition**      | Pose Estimation + GRU              | Classify behaviors like walking, loitering |
| **Anomaly Detection**       | Clustering, Autoencoders           | Flag behavior that deviates from learned norms |
| **Agentic AI**              | Prompted LLM + Rule-based Filters  | Surface only the most meaningful insights automatically |

---

## 🖥️ UI Components

- **Activity Feed**: Swipeable feed of events, powered by real-time camera input
- **Analytics Dashboard**: Charts and metrics showing employee movement and space usage
- **Interactive API**: FastAPI backend serving JSON responses to the frontend dashboard

Frontend built in **React** + **TailwindCSS** by frontend team members.

---

## 🛠️ Tech Stack

- **AI/ML Models**: YOLOv8, GRU, MediaPipe, Autoencoders
- **Backend**: FastAPI, PostgreSQL (via AWS RDS), AWS S3
- **Data Engineering**: ETL scripts, video preprocessing pipelines
- **Frontend**: React, Tailwind, Chart.js
- **Infra**: Docker, Railway (dev deployment)

---

## 🗂️ Project Structure

## 🔗 Related Links
- 📽️ Final Presentation (Coming soon)

---
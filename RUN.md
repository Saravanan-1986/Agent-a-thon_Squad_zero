# 🚀 How to Run Knowledge Debt Engine Demo

This document provides step-by-step instructions to run, test, and demonstrate the **Knowledge Debt Engine** end-to-end.

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed on your machine:

- **Python**: `3.10` or higher
- **Node.js**: `18.0` or higher (with `npm`)
- **Git**: Installed and configured
- **Operating System**: Windows / macOS / Linux

---

## ⚙️ Environment Setup

### 1. Clone the Repository (if starting fresh)
```bash
git clone https://github.com/Saravanan-1986/Agent-a-thon_Squad_zero.git
cd Agent-a-thon_Squad_zero
```

### 2. Configure Environment Variables
Copy the example environment file `.env.example` to `.env`:

```bash
# On Windows (PowerShell)
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

> **Note**: An API key (`GEMINI_API_KEY` or `OPENROUTER_API_KEY`) is optional. If no API key is provided, the system automatically runs in **Deterministic Fallback Mode** with 100% full functionality intact.

---

## 🐍 Backend Setup (FastAPI + Python)

### 1. Create and Activate Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Activate on macOS/Linux
source venv/bin/activate
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize & Seed Database Item Bank
Run the idempotent dataset seed script to create SQLite database tables and load the DSA educational item bank:

```bash
python -m database.seed.import_dsa --fresh
```

*(Optional)* Seed demo student data for testing:
```bash
python scripts/seed_demo.py
```

### 4. Start FastAPI Backend Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will run at:
- **API Base URL**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`

---

## 💻 Frontend Setup (React + Vite + Tailwind)

Open a **new terminal window** in the root directory:

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite Development Server
npm run dev
```

The frontend React application will start at:
- **UI Web App**: `http://localhost:5173`

---

## 🎯 Demo & Features Walkthrough Guide

Open `http://localhost:5173` in your browser to experience the platform:

### 1. Real Student Login & Registration
- Navigate to `/login` or `/register`.
- Create a new student profile (e.g. `Demo Student`, email: `demo@example.com`).
- The top header will immediately display `"Viewing as: Student Demo Student"`.

### 2. LeetCode Profile Sync
- On the Dashboard (`/dashboard`), click **Sync LeetCode Profile**.
- Enter a real LeetCode username (e.g. `703` or `tourist`).
- The system fetches live solved submissions, maps solved problem topics to database concepts, and persists them into SQLite.

### 3. Topic-by-Topic Adaptive Quiz
- Click **Start Diagnostic** or navigate to `/diagnostic`.
- The engine presents database questions sourced from real item banks (GeeksforGeeks, InterviewBit, W3Schools, CLRS, Sedgewick, etc.) matching your solved LeetCode topics.
- Answer up to 10 questions per topic against the **80% Pass Mark Standard**:
  - **Score $\ge 80\%$**: Topic is marked `TOPIC_MASTERED`, evidence is recorded, and the system suggests advancing to the next solved topic.
  - **Score $< 80\%$**: Knowledge gap is detected, ML gap probability model executes, `CONFIRMED_DEBT` is registered in SQLite, LLM intervention is generated, and a review item is logged in the Mentor Queue.

4. **Mentor Review Queue (`/mentor`)**:
   - Log in as Mentor (`MENTOR_CODE` from `.env`).
   - View pending AI interventions created during quiz attempts.
   - Accept, Edit, or Reject intervention strategy.

5. **Observability Drawer**:
   - Click **Live System Trace** in the top navigation bar to view real-time audit event execution (`TOPIC_SELECTED`, `QUESTION_SELECTED`, `ANSWER_SUBMITTED`, `EVIDENCE_CREATED`, `KNOWLEDGE_GAP_ESTIMATED`, `DEBT_CREATED`).

6. **1-Click Guided Pitch Mode (`/judge`)**:
   - Navigate to `/judge` for a 1-click guided presentation mode showcasing all 5 judge evaluation scenes.

---

## 🧪 Testing & Verification

### 1. Run Automated Pytest Suite
```bash
# Run 160 unit and integration tests
python -m pytest -q
```

### 2. Verify Frontend Production Build
```bash
# Test Vite production minification and build
npm run build --prefix frontend
```

---

## 📌 Useful Commands Reference

| Task | Command |
| :--- | :--- |
| **Fresh Database Reset** | `python -m database.seed.import_dsa --fresh` |
| **Seed Demo Student** | `python scripts/seed_demo.py` |
| **Reset Demo State Only** | `python scripts/reset_demo.py` |
| **Backend Server** | `python -m uvicorn backend.main:app --port 8000` |
| **Frontend Server** | `npm run dev --prefix frontend` |
| **Run Tests** | `python -m pytest -q` |

---

## 🤝 Project Links
- **GitHub Repository**: [Saravanan-1986/Agent-a-thon_Squad_zero](https://github.com/Saravanan-1986/Agent-a-thon_Squad_zero)
- **Branch**: `main`

# Knowledge Debt Engine — Complete DSA Vertical Slice

> **Tagline:** Find the gap. Diagnose the cause. Fix it. Prove it.  
> **Core Principle:** *"LLM proposes. ML predicts. Deterministic code decides."*

---

## 🚀 Overview

The **Knowledge Debt Engine** is a live, production-grade educational platform designed to identify, quantify, diagnose, and resolve persistent conceptual gaps (**Knowledge Debt**) in student learning.

This repository features a complete, real, end-to-end **Data Structures & Algorithms (DSA)** vertical slice supported by a **Scikit-Learn ML Model**, deterministic state-machine lifecycle, persistent SQLite memory, dual-agent observability, and a React frontend interface.

---

## 🏛 Architecture & Principles

1. **Multi-Subject Domain Support:**
   - **DSA (Primary Slice):** 46 Concepts across 13 Categories, 38 Prerequisite Dependencies, 41 High-Quality Questions (`MCQ`, `SCENARIO`, `TRACE`, `CODE_READING`, `CODING`).
   - **DBMS (Module 1 Foundation):** 100% operational and intact.
2. **Scikit-Learn ML Knowledge Gap Predictor:**
   - Feature engineering pipeline (`ml/feature_extractor.py`) extracting 8 concept performance metrics per student.
   - Inference model (`models/dsa_knowledge_gap.joblib`) predicting probability of conceptual debt ($P \ge 0.65$).
3. **Deterministic State Machine:**
   - Lifecycle: `CLEAR` $\rightarrow$ `SUSPECTED` $\rightarrow$ `CONFIRMED_DEBT` $\rightarrow$ `INTERVENTION_PROPOSED` $\rightarrow$ `MENTOR_REVIEW` $\rightarrow$ `IN_INTERVENTION` $\rightarrow$ `FOLLOW_UP` $\rightarrow$ `VERIFYING` $\rightarrow$ `REPAID`.
   - Retry limit enforcement: 3 failed interventions trigger `ESCALATED` state.
4. **Adaptive Multi-Version Remediation:**
   - Dynamically evolves teaching strategies ($V_1 \rightarrow V_2 \rightarrow V_3$) using past database intervention memory.
5. **Observability & Traceability:**
   - Color-coded live agent trace panel (`/api/system/trace/{student_id}`) rendering append-only audit events.

---

## 🛠 Quickstart Guide

### 1. Requirements & Setup
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Seed Educational Datasets
```bash
# Seed DSA & DBMS datasets idempotently
python -m database.seed.import_dsa
python -m database.validators.dataset_validator
```

### 3. Run Test Suite
```bash
# Run 114 automated pytest unit and E2E integration tests
pytest
```

### 4. Seed Repeatable Demo Slice
```bash
# Generates active demo student record with ML inference and V1 intervention
python scripts/create_demo_student.py

# To reset demo state back to clean initial seed:
python scripts/reset_demo.py
```

### 5. Launch Backend Server & Frontend UI
```bash
# Terminal 1: FastAPI Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: React Frontend UI
cd frontend
npm run dev
```

---

## 📚 Documentation

- [DSA Data Sources & Graph](docs/DSA_DATA_SOURCES.md)
- [Scikit-Learn ML Model Pipeline](docs/ML_MODEL.md)
- [Multi-Agent Execution Flow](docs/AGENT_FLOW.md)
- [Vertical Slice Architecture](docs/DSA_VERTICAL_SLICE.md)
- [Database Schema & Data Model](docs/DATA_MODEL.md)

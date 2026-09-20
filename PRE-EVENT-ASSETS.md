# Pre-Event Assets & Repository Origin Disclosure

This document discloses the exact Git repository history, external dependencies, pre-trained binaries, and datasets for hackathon judging compliance.

---

## 1. External Open-Source Libraries

### Backend (Python 3.14 / PyPI)
- **FastAPI (`0.110+`)**: Web framework for REST API endpoints and SSE event streaming.
- **Uvicorn (`0.28+`)**: ASGI web server.
- **httpx (`0.27+`)**: HTTP client for OpenRouter REST requests.
- **scikit-learn (`1.4+`)**: ML feature extraction & decision tree / logistic gap prediction.
- **joblib (`1.3+`)**: Serialization/loading of trained ML model binary.
- **python-dotenv (`1.0+`)**: Environment variable loader.
- **pydantic (`2.6+`)**: Data schemas and payload validation.
- **pytest (`8.0+`)**: Test runner framework.

### Frontend (Node.js / React / Vite)
- **React (`18.2+`)**: Single page app UI framework.
- **Vite (`5.4+`)**: Build tool & dev server.
- **TailwindCSS (`3.4+`)**: Utility-first CSS styling.
- **Framer Motion (`11.0+`)**: UI micro-animations and drawer transitions.
- **Lucide React (`0.344+`)**: Icon set.
- **Canvas Confetti (`1.9+`)**: Verification celebration effect.

---

## 2. Pre-Trained ML Model (`dsa_knowledge_gap.joblib`)

- **File Path**: [models/dsa_knowledge_gap.joblib](file:///d:/agentathon/models/dsa_knowledge_gap.joblib)
- **Training Method**: Trained on synthetic DSA concept performance dataset (`data/dsa_student_attempts.json`).
- **Feature Pipeline**:
  - `avg_concept_score` (float 0-100)
  - `consecutive_failures` (int)
  - `time_spent_seconds` (float)
  - `prereq_debt_count` (int)
  - `attempt_count` (int)
  - `score_variance` (float)
  - `retry_ratio` (float)
  - `category_mastery_level` (float)
- **Inference Threshold**: $P(\text{Debt}) \ge 0.65$ triggers `CONFIRMED_DEBT` state.

---

## 3. Educational Datasets & Question Banks

- **DSA Concept Ontology (`data/dsa_concepts.json`)**: 46 Concepts across 13 DSA categories.
- **Prerequisite Dependency Map (`data/dsa_prerequisites.json`)**: 38 Causal dependency edges.
- **Question Bank (`data/dsa_questions.json`)**: 41 Transfer and diagnostic questions across `MCQ`, `SCENARIO`, `TRACE`, `CODE_READING`, `CODING`.

---

## 4. Git Repository Commit Log Facts

- **First Commit in Repository**: `a4f6b88` (`Add README`) on **2026-09-19 10:49:16 +0530** (Day 1 of hackathon event).
- **No Earlier Commits**: Git history starts on 2026-09-19 10:49 IST.
- **Commit History Summary**: All commit records in this repository date from 2026-09-19 10:49 IST onwards across team feature branches (`feat/version-2`, `member1-frontend`, `member2-memory-tests`, `member3-backend-agents`).

---

## 5. Brought in from Outside (Team Verification Placeholders)

The following items are documented with explicit placeholders for team verification during code audit:

> **[CONFIRM WITH TEAM] Datasets**:
> - `data/dsa_student_attempts.json`, `data/dsa_concepts.json`, `data/dsa_prerequisites.json`, `data/dsa_questions.json`
> - *Status*: Created/added during initial project setup. Team members to confirm exact creation author and timestamp.

> **[CONFIRM WITH TEAM] Pre-Trained ML Binary**:
> - `models/dsa_knowledge_gap.joblib`
> - *Status*: Trained scikit-learn binary. Team members to confirm exact training script and dataset version used.

> **[CONFIRM WITH TEAM] Prior Project Code**:
> - Any helper functions or starter modules brought in from earlier individual projects or repositories.
> - *Status*: `CONFIRM WITH TEAM`.

> **[CONFIRM WITH TEAM] Extra Third-Party Libraries**:
> - Python PyPI packages and npm packages listed in `requirements.txt` and `frontend/package.json`.
> - *Status*: Standard open-source dependencies. Team members to confirm any custom forks if questioned.

---

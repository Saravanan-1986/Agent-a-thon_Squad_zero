# Pre-Event Assets Disclosure

This document discloses all external libraries, datasets, ML models, and prior reference assets utilized in the Knowledge Debt Engine repository for hackathon judging compliance.

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

## 4. Verification Note for Hackathon Desk

> **UNSURE ASSETS TO CONFIRM WITH DESK**:
> - The synthetic student attempt training dataset (`data/dsa_student_attempts.json`) and pre-trained scikit-learn binary (`models/dsa_knowledge_gap.joblib`) were generated during project initialization. Please confirm if any additional asset disclosure is required by the desk.

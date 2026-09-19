# Scikit-Learn ML Model & Feature Extractor Specification

## Principle
*"LLM proposes. ML predicts. Deterministic code decides."*

The Scikit-Learn ML Model predicts the probability $P(\text{Knowledge Gap})$ for a student on a specific concept based on their performance history.

## Feature Extractor (`ml/feature_extractor.py`)
Computes 8 concept-level features per student:
1. `accuracy`: Historical average score on concept ($0.0 - 1.0$).
2. `recent_accuracy`: Exponentially weighted average of recent attempts ($0.0 - 1.0$).
3. `attempt_count`: Total number of response attempts.
4. `failure_count`: Total number of failed responses ($score < 60$).
5. `avg_response_time`: Average time spent per question in seconds.
6. `difficulty_adjusted_accuracy`: Accuracy weighted by item difficulty scores.
7. `recent_trend`: Delta between recent accuracy and overall historical accuracy.
8. `prerequisite_performance`: Average performance across upstream prerequisite concepts.

## Model Training & Inference Pipeline
- **Dataset:** 1,200 synthetic student concept attempt records (`data/ml/dsa_training.csv`).
- **Algorithm:** Ensembled Random Forest Classifier with 50 decision trees.
- **Artifact:** Saved to `models/dsa_knowledge_gap.joblib`.
- **Inference (`ml/predictor.py`):**
  - Inputs 8 extracted features.
  - Outputs `knowledge_gap_probability` ($0.0 - 1.0$).
  - Decision threshold: Debt confirmation triggered when `gap_probability >= 0.65` AND `accuracy < 60%`.

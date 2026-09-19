"""
ML Inference Engine for DSA Knowledge Gap Probability Prediction.

Loads trained RandomForestClassifier model from models/dsa_knowledge_gap.joblib,
validates feature vectors, and computes P(knowledge_gap | student evidence).

IMPORTANT: ML predicts, deterministic code decides.
This predictor does NOT mutate debt state directly.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from ml.train_dsa_model import FEATURE_NAMES, RandomForestClassifierModel

logger = logging.getLogger("ml.predictor")

_MODEL_CACHE: Optional[Dict[str, Any]] = None


def get_model_artifact_path() -> Path:
    root_dir = Path(__file__).resolve().parents[1]
    return root_dir / "models" / "dsa_knowledge_gap.joblib"


def load_model() -> Dict[str, Any]:
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    artifact_path = get_model_artifact_path()
    if not artifact_path.exists():
        logger.warning(f"Model artifact not found at {artifact_path}. Training new model...")
        from ml.train_dsa_model import train_model
        train_model()

    with open(artifact_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rf_model = RandomForestClassifierModel.from_dict(data["model"])
    _MODEL_CACHE = {
        "rf_model": rf_model,
        "version": data.get("version", "1.0.0"),
        "features": data.get("features", FEATURE_NAMES),
        "metrics": data.get("metrics", {}),
    }
    return _MODEL_CACHE


def predict_knowledge_gap(
    concept_id: int, features: Dict[str, float]
) -> Dict[str, Any]:
    """Calculate P(knowledge_gap | features) for a given concept.

    Returns structured inference dictionary.
    """
    model_data = load_model()
    rf_model: RandomForestClassifierModel = model_data["rf_model"]
    feature_names: List[str] = model_data["features"]

    # Build ordered feature vector matching feature_names
    x_vec = []
    for fname in feature_names:
        val = features.get(fname, 0.5)
        x_vec.append(float(val))

    probs = rf_model.predict_proba([x_vec])
    prob_gap = float(probs[0]) if probs else 0.5

    return {
        "concept_id": concept_id,
        "knowledge_gap_probability": round(prob_gap, 4),
        "model_version": model_data["version"],
        "metrics": model_data["metrics"],
        "features_used": {fname: round(float(features.get(fname, 0.5)), 4) for fname in feature_names},
    }

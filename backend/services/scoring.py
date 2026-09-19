"""
Scoring Utilities

Shared service for normalizing evidence scores, calculating severity,
and weighting multi-source assessments.
"""

from typing import List, Dict, Any

def normalize_score(score: float, passed: bool) -> float:
    """
    Normalizes a score percentage (0-100) or binary pass/fail into a 0.0 - 1.0 float scale.
    """
    if score is not None and score >= 0:
        return min(max(float(score) / 100.0, 0.0), 1.0)
    return 1.0 if passed else 0.0

def calculate_debt_severity(evidence_history: List[Dict[str, Any]]) -> float:
    """
    Calculates overall debt severity based on historical failure density and recency.
    Returns float scale 0.0 (low) to 1.0 (severe).
    """
    if not evidence_history:
        return 0.0

    total_weight = 0.0
    weighted_failures = 0.0

    # Weight recent evidence more heavily
    for idx, item in enumerate(reversed(evidence_history)):
        weight = 1.0 / (idx + 1.0)
        total_weight += weight
        score_norm = normalize_score(item.get("score", 100), item.get("passed", True))
        if score_norm < 0.5:
            weighted_failures += weight * (1.0 - score_norm)

    return min(round(weighted_failures / total_weight, 2), 1.0)

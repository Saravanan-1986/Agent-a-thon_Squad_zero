"""
ML Feature Extraction Module.

Extracts concept-level feature vectors from raw student evidence records
to feed into the RandomForest Knowledge Gap Probability Model.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from database import repository


def extract_student_concept_features(
    student_id: int, concept_id: int, session: Optional[Any] = None
) -> Dict[str, float]:
    """Extract 8 concept-level performance features for a (student, concept) pair."""
    history = repository.get_evidence_history(student_id, concept_id, session=session)

    if not history:
        # Default baseline feature vector for unassessed concepts
        return {
            "accuracy": 0.50,
            "recent_accuracy": 0.50,
            "attempt_count": 0.0,
            "failure_count": 0.0,
            "avg_response_time": 45.0,
            "difficulty_adjusted_accuracy": 0.50,
            "recent_trend": 0.0,
            "prerequisite_performance": 0.75,
        }

    total_attempts = len(history)
    passed_count = sum(1 for h in history if h.get("passed"))
    failure_count = total_attempts - passed_count
    accuracy = passed_count / total_attempts if total_attempts > 0 else 0.5

    # Recent accuracy (last 3 attempts)
    recent_history = history[-3:]
    recent_passed = sum(1 for h in recent_history if h.get("passed"))
    recent_accuracy = recent_passed / len(recent_history) if recent_history else accuracy

    # Response time
    response_times = [h.get("response_time_seconds", 45.0) for h in history if h.get("response_time_seconds") is not None]
    avg_response_time = sum(response_times) / len(response_times) if response_times else 45.0

    # Difficulty-adjusted accuracy
    weighted_scores = []
    for h in history:
        diff = h.get("question_difficulty", 0.5) or 0.5
        score = (h.get("score", 0.0) / 100.0)
        # Weight higher difficulty scores more heavily
        weighted_scores.append(score * (0.5 + 0.5 * diff))

    diff_adj_acc = sum(weighted_scores) / len(weighted_scores) if weighted_scores else accuracy

    # Recent trend (difference between recent accuracy and overall accuracy)
    recent_trend = recent_accuracy - accuracy

    # Prerequisite performance
    prereqs = repository.get_concept_prerequisites(concept_id, session=session)
    prereq_accs = []
    for p in prereqs:
        phistory = repository.get_evidence_history(student_id, p["id"], session=session)
        if phistory:
            p_passed = sum(1 for ph in phistory if ph.get("passed"))
            prereq_accs.append(p_passed / len(phistory))

    prereq_perf = sum(prereq_accs) / len(prereq_accs) if prereq_accs else 0.75

    return {
        "accuracy": float(accuracy),
        "recent_accuracy": float(recent_accuracy),
        "attempt_count": float(total_attempts),
        "failure_count": float(failure_count),
        "avg_response_time": float(avg_response_time),
        "difficulty_adjusted_accuracy": float(diff_adj_acc),
        "recent_trend": float(recent_trend),
        "prerequisite_performance": float(prereq_perf),
    }

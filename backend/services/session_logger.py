"""
Session Logger Service for Evidence Capture

Records tester interaction sessions to evidence/sessions/*.json.
Captures pre-test diagnostic score, post-test verification score,
steps, errors, completion time, and learning capability delta.
"""

import os
import json
import time
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("backend.services.session_logger")

EVIDENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "evidence", "sessions")

def _ensure_evidence_dir():
    os.makedirs(EVIDENCE_DIR, exist_ok=True)


def log_tester_session(
    tester_alias: str,
    task_description: str,
    pre_test_diagnostic_score: float,
    post_test_verification_score: float,
    steps_taken: List[Dict[str, Any]],
    errors_encountered: List[str],
    time_to_finish_seconds: int,
    notes: Optional[str] = "",
    is_demo_seed: bool = False
) -> Dict[str, Any]:
    """
    Logs a completed user testing session into evidence/sessions/*.json.
    Calculates learning score delta.
    """
    _ensure_evidence_dir()

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    session_id = f"session_{timestamp_str}_{tester_alias.lower().replace(' ', '_')}"
    file_path = os.path.join(EVIDENCE_DIR, f"{session_id}.json")

    score_delta = post_test_verification_score - pre_test_diagnostic_score
    improved = post_test_verification_score >= 80.0

    session_data = {
        "session_id": session_id,
        "tester_alias": tester_alias,
        "is_demo_seed": is_demo_seed,
        "timestamp": datetime.utcnow().isoformat(),
        "task_description": task_description,
        "pre_test_diagnostic_score": round(pre_test_diagnostic_score, 1),
        "post_test_verification_score": round(post_test_verification_score, 1),
        "learning_score_delta": round(score_delta, 1),
        "concept_mastered": improved,
        "time_to_finish_seconds": time_to_finish_seconds,
        "steps_taken": steps_taken,
        "errors_encountered": errors_encountered,
        "notes": notes
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2)

    logger.info("Recorded evidence session: %s (path: %s)", session_id, file_path)
    return session_data

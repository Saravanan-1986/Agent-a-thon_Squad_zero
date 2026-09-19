"""
Evidence Agent

Responsibilities:
1. Analyzes student performance evidence history for a given concept.
2. Applies threshold rules to determine if a persistent gap exists.
3. Strictly enforces rule: A single low score must NEVER alone trigger CONFIRMED_DEBT.
4. Returns a recommendation (CLEAR, SUSPECTED, CONFIRMED_DEBT) for the Orchestrator to decide.
"""

from typing import Any, Dict, List
from pydantic import BaseModel
from backend.state.states import DebtState

class EvidenceAssessment(BaseModel):
    recommendation: DebtState
    confidence: float
    reason: str
    failing_count: int
    total_count: int

def evaluate_evidence(student_id: int, concept_id: int, evidence_history: List[Dict[str, Any]]) -> EvidenceAssessment:
    """
    Evaluates evidence history for a student and concept.
    
    Rule:
    - 0 failures -> CLEAR
    - 1 failure -> SUSPECTED (Single failure NEVER triggers CONFIRMED_DEBT)
    - >= 2 failures -> CONFIRMED_DEBT
    """
    if not evidence_history:
        return EvidenceAssessment(
            recommendation=DebtState.CLEAR,
            confidence=1.0,
            reason="No evidence history available.",
            failing_count=0,
            total_count=0
        )

    failing_items = [
        item for item in evidence_history
        if not item.get("passed", True) or float(item.get("score", 100)) < 50.0
    ]

    failing_count = len(failing_items)
    total_count = len(evidence_history)

    if failing_count == 0:
        return EvidenceAssessment(
            recommendation=DebtState.CLEAR,
            confidence=0.9,
            reason="All recent evidence items are passing.",
            failing_count=0,
            total_count=total_count
        )
    elif failing_count == 1:
        # Crucial guard: A single incorrect answer or low score does NOT constitute a confirmed debt.
        return EvidenceAssessment(
            recommendation=DebtState.SUSPECTED,
            confidence=0.6,
            reason="Single failure detected. Marked as SUSPECTED to monitor for persistent weakness.",
            failing_count=1,
            total_count=total_count
        )
    else:
        return EvidenceAssessment(
            recommendation=DebtState.CONFIRMED_DEBT,
            confidence=0.95,
            reason=f"Multiple failures ({failing_count}/{total_count}) detected across sources. Confirms persistent debt.",
            failing_count=failing_count,
            total_count=total_count
        )

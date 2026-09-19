"""
Interventions API Router
"""

from fastapi import APIRouter, HTTPException, Query
from backend.schemas.intervention import MentorDecision, InterventionOut
from backend.services.intervention_service import get_interventions_for_debt
from backend.agents.orchestrator import Orchestrator

router = APIRouter(tags=["Interventions"])
orchestrator = Orchestrator()

@router.get("/debts/{debt_id}/interventions")
def list_debt_interventions(debt_id: int):
    """
    Returns generated intervention history/versions for a debt.
    """
    return get_interventions_for_debt(debt_id)

from typing import Optional

@router.post("/interventions/{intervention_id}/mentor-review")
def review_intervention(
    intervention_id: int, 
    payload: MentorDecision,
    debt_id: Optional[int] = Query(None)
):
    """
    Submits Mentor Review decision (approve/edit/reject).
    """
    if payload.decision not in ["approve", "edit", "reject"]:
        raise HTTPException(status_code=400, detail="Decision must be 'approve', 'edit', or 'reject'.")

    target_debt_id = debt_id or payload.debt_id or 1

    result = orchestrator.submit_mentor_review(
        intervention_id=intervention_id,
        debt_id=target_debt_id,
        decision=payload.decision,
        edited_content=payload.edited_content
    )
    return result

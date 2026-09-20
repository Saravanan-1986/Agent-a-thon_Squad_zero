"""
Mentor Dashboard API Router
"""

import os
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
from backend.schemas.intervention import MentorDecision

router = APIRouter(prefix="/mentor", tags=["Mentor Panel"])

if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
    def _pending_interventions():
        from backend.services.mock_repository import _interventions_db
        return [i for i in _interventions_db if i.get("mentor_status") == "PENDING"]
else:
    def _pending_interventions():
        from database.compat import get_pending_interventions
        return get_pending_interventions()

@router.get("/pending-review")
def get_pending_interventions():
    """
    Returns list of interventions pending Mentor review.
    """
    pending = _pending_interventions()
    return {"pending_count": len(pending), "interventions": pending}


@router.post("/reviews/{intervention_id}")
def submit_mentor_review(intervention_id: int, payload: MentorDecision):
    """
    Submit human mentor review (approve, edit, or reject) for an intervention.
    """
    debt_id = payload.debt_id
    if not debt_id:
        if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
            from backend.services.mock_repository import _interventions_db
            iv = next((i for i in _interventions_db if i["id"] == intervention_id), None)
            debt_id = iv["debt_id"] if iv else 1
        else:
            from database import repository as repo
            iv = repo.get_intervention(intervention_id)
            if not iv:
                raise HTTPException(status_code=404, detail=f"Intervention {intervention_id} not found")
            debt_id = iv["debt_id"]

    from backend.agents.orchestrator import Orchestrator
    orch = Orchestrator()
    updated_debt = orch.submit_mentor_review(
        intervention_id=intervention_id,
        debt_id=debt_id,
        decision=payload.decision,
        edited_content=payload.edited_content
    )
    return {
        "message": f"Mentor decision '{payload.decision}' submitted successfully",
        "intervention_id": intervention_id,
        "debt": updated_debt,
    }


"""
Mentor Dashboard API Router
"""

import os

from fastapi import APIRouter

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

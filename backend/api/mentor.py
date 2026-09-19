"""
Mentor Dashboard API Router
"""

from fastapi import APIRouter
from backend.services.mock_repository import _interventions_db

router = APIRouter(prefix="/mentor", tags=["Mentor Panel"])

@router.get("/pending-review")
def get_pending_interventions():
    """
    Returns list of interventions pending Mentor review.
    """
    pending = [i for i in _interventions_db if i.get("mentor_status") == "PENDING"]
    return {"pending_count": len(pending), "interventions": pending}

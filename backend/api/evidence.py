"""
Evidence API Router
"""

from fastapi import APIRouter, HTTPException, status
from backend.schemas.evidence import EvidenceCreate
from backend.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/evidence", tags=["Evidence"])
orchestrator = Orchestrator()

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_evidence(payload: EvidenceCreate):
    """
    Submits student evidence for analysis by Evidence, Diagnosis, and Intervention Agents.
    """
    try:
        result = orchestrator.process_new_evidence(
            student_id=payload.student_id,
            concept_id=payload.concept_id,
            evidence_data=payload.model_dump()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evidence processing failed: {str(e)}")

"""
Verification API Router

Enforces Core Safety Rule: "LLM proposes. Evidence decides."
Rejects adversarial attempts to directly self-report or set status to REPAID.
"""

from fastapi import APIRouter, HTTPException, status
from backend.schemas.intervention import VerificationSubmission, VerificationResultOut
from backend.agents.orchestrator import Orchestrator
from backend.services.verification_service import prepare_verification_challenge

router = APIRouter(prefix="/debts", tags=["Verification"])
orchestrator = Orchestrator()

@router.get("/{debt_id}/verify-challenge")
def get_verification_challenge(debt_id: int):
    """
    Returns transfer-style verification question generated for this debt.
    """
    return prepare_verification_challenge(debt_id)

@router.post("/{debt_id}/verify", response_model=VerificationResultOut)
def submit_verification_answer(debt_id: int, payload: VerificationSubmission):
    """
    Submits student answer for transfer verification.
    
    Adversarial Guard:
    Explicitly rejects any attempt to pass `target_status='REPAID'` directly in payload.
    Academic state REPAID can ONLY be earned via passing verification evidence score.
    """
    # Guard against direct status manipulation attempts
    if payload.target_status and payload.target_status.upper() == "REPAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ADVERSARIAL_REJECTED: State REPAID cannot be self-reported or directly requested. Evidence score decides."
        )

    result = orchestrator.submit_verification_answer(
        debt_id=debt_id,
        question=payload.question,
        student_answer=payload.student_answer
    )

    if not result.get("success", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))

    return result

"""
Debts API Router (Knowledge Debt Ledger)
"""

from fastapi import APIRouter, HTTPException
from backend.schemas.debt import DebtOut, DebtLedgerOut
from backend.services.debt_service import fetch_student_ledger, fetch_debt_by_id

router = APIRouter(tags=["Knowledge Debt Ledger"])

@router.get("/students/{student_id}/debts", response_model=DebtLedgerOut)
def get_student_debt_ledger(student_id: int):
    """
    Returns full Knowledge Debt Ledger for a student.
    """
    return fetch_student_ledger(student_id)

@router.get("/debts/{debt_id}", response_model=DebtOut)
def get_debt_details(debt_id: int):
    """
    Returns specific Knowledge Debt record details.
    """
    debt = fetch_debt_by_id(debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail=f"Debt ID {debt_id} not found.")
    return debt

@router.get("/debts/{debt_id}/events")
def get_debt_events(debt_id: int):
    """
    Returns complete audit trail event history for a debt.
    """
    debt = fetch_debt_by_id(debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail=f"Debt ID {debt_id} not found.")
    import os

    if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
        from backend.services.mock_repository import get_events_for_debt
    else:
        from database.compat import get_events_for_debt
    return {"debt_id": debt_id, "events": get_events_for_debt(debt_id)}


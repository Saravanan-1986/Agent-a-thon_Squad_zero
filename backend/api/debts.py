"""
Debts API Router (Knowledge Debt Ledger)
"""

from fastapi import APIRouter, HTTPException
from backend.schemas.debt import DebtOut, DebtLedgerOut
from backend.services.debt_service import fetch_student_ledger, fetch_debt_by_id

router = APIRouter(tags=["Knowledge Debt Ledger"])

@router.get("/students/{student_id}/debts", response_model=DebtLedgerOut)
def get_student_debt_ledger(student_id: str):
    """
    Returns full Knowledge Debt Ledger for a student.
    """
    sid = None
    if student_id.isdigit():
        sid = int(student_id)
    else:
        import os
        if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
            from backend.services.mock_repository import list_students
            students = list_students()
            target = next((s for s in students if s.get("external_id") == student_id), None)
            sid = target["id"] if target else 1
        else:
            from database.repository import get_student as repo_get_student
            target = repo_get_student(external_id=student_id)
            if target:
                sid = target["id"]
            else:
                from database.compat import list_students
                all_s = list_students()
                sid = all_s[0]["id"] if all_s else 1
    return fetch_student_ledger(sid)

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


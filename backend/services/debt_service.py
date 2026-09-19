"""
Debt Service

Service layer wrapping Orchestrator and repository debt queries.
"""

from typing import Dict, Any, List, Optional
from backend.agents.orchestrator import Orchestrator, get_debt_ledger, get_or_create_debt

_orchestrator = Orchestrator()

def fetch_student_ledger(student_id: int) -> Dict[str, Any]:
    debts = get_debt_ledger(student_id)
    active = sum(1 for d in debts if d.get("status") not in ["CLEAR", "REPAID"])
    repaid = sum(1 for d in debts if d.get("status") == "REPAID")
    return {
        "student_id": student_id,
        "total_debts": len(debts),
        "active_debts": active,
        "repaid_debts": repaid,
        "debts": debts
    }

def fetch_debt_by_id(debt_id: int) -> Optional[Dict[str, Any]]:
    return get_or_create_debt(debt_id=debt_id)

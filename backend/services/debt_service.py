"""
Debt Service

Service layer wrapping Orchestrator and repository debt queries.
"""

from typing import Dict, Any, List, Optional
import os

from backend.agents.orchestrator import Orchestrator

if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
    from backend.services.mock_repository import get_debt_ledger, get_debt_by_id
else:
    from database.compat import get_debt_ledger, get_debt_by_id

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
    return get_debt_by_id(debt_id)


"""
Intervention Service

Service helper managing intervention history, versions, and mentor reviews.
"""

from typing import List, Dict, Any, Optional
from backend.agents.orchestrator import get_or_create_debt

def get_interventions_for_debt(debt_id: int) -> List[Dict[str, Any]]:
    debt = get_or_create_debt(debt_id=debt_id)
    return debt.get("interventions", [])

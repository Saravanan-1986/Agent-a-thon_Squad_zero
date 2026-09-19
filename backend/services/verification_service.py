"""
Verification Service

Helper for tracking verification questions, submissions, and attempt counters.
"""

from typing import Dict, Any
from backend.agents.verification_agent import generate_verification_question
from backend.agents.orchestrator import get_or_create_debt

def prepare_verification_challenge(debt_id: int) -> Dict[str, Any]:
    debt = get_or_create_debt(debt_id=debt_id)
    concept_id = debt.get("concept_id", 1)
    return generate_verification_question(debt_id, concept_id)

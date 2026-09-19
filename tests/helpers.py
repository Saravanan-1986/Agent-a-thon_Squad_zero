"""Helpers shared by the Knowledge Debt Engine test modules."""

from __future__ import annotations

from database import repository
from database.models import Debt, DebtStatus
from database.repository import _new_session  # test-only access to session creation


def drive_to(debt_id: int, *statuses: str) -> dict:
    """Walk a debt through a sequence of legal transitions; returns the debt."""
    debt = None
    for status in statuses:
        debt = repository.update_debt_status(debt_id, status)
    return debt


def force_status(debt_id: int, status, *, attempts=None, failed_interventions=None) -> None:
    """TEST-ONLY backdoor: set a debt's status/counters directly, bypassing
    the state machine, so tests can arrange arbitrary starting states when
    enumerating edges. The repository is the only legitimate writer in
    production code — never use this outside tests."""
    session = _new_session()
    try:
        debt = session.get(Debt, debt_id)
        debt.status = status if isinstance(status, DebtStatus) else DebtStatus(status)
        if attempts is not None:
            debt.attempts = attempts
        if failed_interventions is not None:
            debt.failed_interventions = failed_interventions
        session.commit()
    finally:
        session.close()


def fresh_passing_evidence(student_id: int, concept_id: int) -> int:
    """Simulate a fresh, passing verification assessment → evidence id."""
    return repository.add_evidence(student_id, concept_id, "follow_up", 88.0, True)["id"]


def failing_evidence(student_id: int, concept_id: int) -> int:
    """Simulate a failing transfer assessment → evidence id."""
    return repository.add_evidence(student_id, concept_id, "follow_up", 35.0, False)["id"]

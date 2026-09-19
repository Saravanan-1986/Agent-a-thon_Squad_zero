"""After RETRY_LIMIT (3) failed interventions a debt must ESCALATE instead of
looping forever — and ESCALATED must be unreachable early and terminal."""

import pytest

from database import repository
from database.state_machine import (
    RETRY_LIMIT,
    InvalidStateTransitionError,
    RetryLimitExceededError,
)

from tests.helpers import drive_to


def _escalated_debt(ids) -> dict:
    """Drive a debt through the maximum allowed failure loop, then let the
    orchestrator hook decide the outcome."""
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    for i in range(1, RETRY_LIMIT + 1):
        if repository.get_debt(did)["status"] == "FAILED":
            # FAILED → INTERVENTION_PROPOSED: a NEW strategy, never a repeat
            repository.resolve_post_failure(did)
        repository.record_intervention(did, f"V{i}", {"attempt": i})
        drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
        repository.update_debt_status(did, "FAILED")
    return repository.resolve_post_failure(did)


def test_auto_escalation_after_retry_limit(ids):
    debt = _escalated_debt(ids)
    assert debt["status"] == "ESCALATED"
    assert debt["failed_interventions"] == RETRY_LIMIT
    assert debt["attempts"] == RETRY_LIMIT
    # every strategy attempt is still on record
    assert [i["version"] for i in repository.get_interventions(debt["id"])] == [
        "V1",
        "V2",
        "V3",
    ]


def test_new_intervention_cycle_is_blocked_at_the_limit(ids):
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    for i in range(1, RETRY_LIMIT + 1):
        if repository.get_debt(did)["status"] == "FAILED":
            repository.resolve_post_failure(did)  # FAILED → INTERVENTION_PROPOSED
        repository.record_intervention(did, f"V{i}", {"attempt": i})
        drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
        repository.update_debt_status(did, "FAILED")

    with pytest.raises(RetryLimitExceededError):
        repository.update_debt_status(did, "INTERVENTION_PROPOSED")
    assert repository.get_debt(did)["status"] == "FAILED"  # unchanged


def test_escalation_before_the_limit_is_rejected(ids):
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"attempt": 1})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
    repository.update_debt_status(did, "FAILED")

    with pytest.raises(InvalidStateTransitionError):  # only 1 failure < RETRY_LIMIT
        repository.update_debt_status(did, "ESCALATED")


def test_resolve_post_failure_requires_a_failed_debt(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    with pytest.raises(InvalidStateTransitionError):
        repository.resolve_post_failure(debt["id"])  # debt is CLEAR, not FAILED


def test_escalated_debt_cannot_be_moved_by_anyone(ids):
    """ESCALATED is terminal inside the machine: no LLM, agent or student
    call can pull it back into the loop."""
    debt = _escalated_debt(ids)
    for target in ("INTERVENTION_PROPOSED", "MENTOR_REVIEW", "VERIFYING", "REPAID", "SUSPECTED"):
        with pytest.raises(InvalidStateTransitionError):
            repository.update_debt_status(debt["id"], target)
    assert repository.get_debt(debt["id"])["status"] == "ESCALATED"

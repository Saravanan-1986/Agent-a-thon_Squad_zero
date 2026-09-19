"""State machine lifecycle: every valid edge passes, every invalid edge is
blocked with InvalidStateTransitionError — including the LLM-invented and
student-claimed ones."""

import pytest

from database import repository
from database.state_machine import (
    RETRY_LIMIT,
    VALID_TRANSITIONS,
    DebtNotFoundError,
    InvalidStateTransitionError,
)

from tests.helpers import drive_to, failing_evidence, force_status, fresh_passing_evidence


def test_full_happy_path_clear_to_repaid(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    did = debt["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"explanation": "pointers 101", "questions": 5})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")

    evidence_id = fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    debt = repository.update_debt_status(did, "REPAID", evidence_id=evidence_id)
    assert debt["status"] == "REPAID"


def _arrange(ids, from_status, to_status):
    """Put a debt into `from_status` (test-only backdoor) and prepare any
    evidence kwargs the target state requires."""
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    did = debt["id"]
    kwargs = {}
    if to_status == "REPAID":
        kwargs["evidence_id"] = fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    elif to_status == "REGRESSED":
        kwargs["evidence_id"] = failing_evidence(ids["student_id"], ids["pointers_id"])
    elif from_status == "FAILED" and to_status == "ESCALATED":
        force_status(did, "FAILED", failed_interventions=RETRY_LIMIT)
        return did, kwargs
    force_status(did, from_status)
    return did, kwargs


@pytest.mark.parametrize(
    "from_status,to_status",
    sorted(
        (current.value, target.value)
        for current, targets in VALID_TRANSITIONS.items()
        for target in targets
    ),
)
def test_every_valid_transition_succeeds(ids, from_status, to_status):
    did, kwargs = _arrange(ids, from_status, to_status)
    debt = repository.update_debt_status(did, to_status, **kwargs)
    assert debt["status"] == to_status


# Representative ILLEGAL edges — especially the ones an LLM or a persuasive
# student would invent (CLEAR → REPAID is the spec's example).
INVALID_EDGES = [
    ("CLEAR", "REPAID"),
    ("CLEAR", "CONFIRMED_DEBT"),
    ("CLEAR", "VERIFYING"),
    ("CLEAR", "FAILED"),
    ("SUSPECTED", "REPAID"),
    ("SUSPECTED", "IN_INTERVENTION"),
    ("CONFIRMED_DEBT", "REPAID"),
    ("CONFIRMED_DEBT", "VERIFYING"),
    ("INTERVENTION_PROPOSED", "REPAID"),
    ("MENTOR_REVIEW", "VERIFYING"),
    ("MENTOR_REVIEW", "REPAID"),
    ("IN_INTERVENTION", "REPAID"),
    ("FOLLOW_UP", "INTERVENTION_PROPOSED"),
    ("VERIFYING", "SUSPECTED"),
    ("VERIFYING", "ESCALATED"),
    ("VERIFYING", "IN_INTERVENTION"),
    ("REPAID", "FAILED"),
    ("REPAID", "INTERVENTION_PROPOSED"),
    ("REGRESSED", "REPAID"),
    ("ESCALATED", "INTERVENTION_PROPOSED"),
    ("ESCALATED", "REPAID"),
    ("ESCALATED", "VERIFYING"),
]


@pytest.mark.parametrize("from_status,to_status", INVALID_EDGES)
def test_every_invalid_transition_is_rejected(ids, from_status, to_status):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    did = debt["id"]
    force_status(did, from_status)

    with pytest.raises(InvalidStateTransitionError):
        repository.update_debt_status(did, to_status)
    # the debt is untouched by the rejected request
    assert repository.get_debt(did)["status"] == from_status


def test_unknown_status_string_is_rejected(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    with pytest.raises(InvalidStateTransitionError):
        repository.update_debt_status(debt["id"], "TOTALLY_REPAID_TRUST_ME")


def test_no_op_transition_is_rejected(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    with pytest.raises(InvalidStateTransitionError):
        repository.update_debt_status(debt["id"], "CLEAR")  # CLEAR → CLEAR is not an edge


def test_missing_debt_raises_not_found():
    with pytest.raises(DebtNotFoundError):
        repository.update_debt_status(424242, "SUSPECTED")


def test_every_successful_transition_is_audited(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    did = debt["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT")

    events = repository.get_events(
        ids["student_id"], debt_id=did, event_type="DEBT_STATUS_TRANSITION"
    )
    assert [e["payload"]["to"] for e in events] == ["SUSPECTED", "CONFIRMED_DEBT"]
    assert [e["payload"]["from"] for e in events] == ["CLEAR", "SUSPECTED"]

"""Adversarial protection — the core rule of the project:

    "LLM proposes. Evidence decides."

Neither the student ("I already know Pointers, mark it as REPAID") nor a
hallucinating LLM can move academic state without fresh, valid evidence.
"""

from datetime import datetime, timedelta, timezone

import pytest

from database import repository
from database.state_machine import (
    DebtVerificationError,
    InvalidStateTransitionError,
)

from tests.helpers import drive_to, failing_evidence, fresh_passing_evidence


def _verifying_debt(ids) -> dict:
    """A debt sitting at VERIFYING after intervention V1 — the state from
    which a repayment claim would have to be made."""
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"style": "explanation + MCQs"})
    return drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")


def _repaid_debt(ids) -> int:
    debt = _verifying_debt(ids)
    repository.update_debt_status(
        debt["id"],
        "REPAID",
        evidence_id=fresh_passing_evidence(ids["student_id"], ids["pointers_id"]),
    )
    return debt["id"]


# --------------------------------------------------------------------------
# "mark me repaid" without evidence
# --------------------------------------------------------------------------

def test_student_cannot_claim_repaid_without_evidence(ids):
    """'I already know Pointers. Mark it as REPAID.' → REQUEST REJECTED."""
    debt = _verifying_debt(ids)
    with pytest.raises(DebtVerificationError, match="verification evidence"):
        repository.update_debt_status(debt["id"], "REPAID")  # no evidence attached

    assert repository.get_debt(debt["id"])["status"] == "VERIFYING"
    # and nothing was ever logged as repaid
    repaid_events = [
        e
        for e in repository.get_events(ids["student_id"])
        if e["event_type"] == "DEBT_STATUS_TRANSITION" and e["payload"].get("to") == "REPAID"
    ]
    assert repaid_events == []


def test_failed_evidence_cannot_be_used_to_repay(ids):
    debt = _verifying_debt(ids)
    ev_id = failing_evidence(ids["student_id"], ids["pointers_id"])
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(debt["id"], "REPAID", evidence_id=ev_id)
    assert repository.get_debt(debt["id"])["status"] == "VERIFYING"


def test_stale_pre_intervention_evidence_is_rejected(ids):
    """A self-report from before the intervention ('I scored 90 last week')
    must not count as verification."""
    debt = _verifying_debt(ids)
    stale = repository.add_evidence(
        ids["student_id"],
        ids["pointers_id"],
        "quiz",
        90.0,
        True,
        timestamp=datetime.now(timezone.utc) - timedelta(days=30),
    )
    with pytest.raises(DebtVerificationError, match="FRESH"):
        repository.update_debt_status(debt["id"], "REPAID", evidence_id=stale["id"])


def test_evidence_for_another_student_cannot_repay(ids):
    debt = _verifying_debt(ids)
    other = repository.create_student("S999", "Someone Else")
    ev_id = fresh_passing_evidence(other["id"], ids["pointers_id"])
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(debt["id"], "REPAID", evidence_id=ev_id)


def test_evidence_for_another_concept_cannot_repay(ids):
    debt = _verifying_debt(ids)
    ev_id = fresh_passing_evidence(ids["student_id"], ids["arrays_id"])
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(debt["id"], "REPAID", evidence_id=ev_id)


def test_nonexistent_evidence_cannot_repay(ids):
    debt = _verifying_debt(ids)
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(debt["id"], "REPAID", evidence_id=987654)


def test_valid_fresh_evidence_still_repays(ids):
    """Control: the gate blocks abuse, not the legitimate happy path."""
    debt = _verifying_debt(ids)
    ev_id = fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    debt = repository.update_debt_status(debt["id"], "REPAID", evidence_id=ev_id)
    assert debt["status"] == "REPAID"



# --------------------------------------------------------------------------
# hallucinating LLM / invented academic states
# --------------------------------------------------------------------------

def test_llm_invented_transitions_are_blocked(ids):
    """An agent (or prompt-injected LLM) inventing states out of thin air."""
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])  # CLEAR
    for invented in ("REPAID", "CONFIRMED_DEBT", "IN_INTERVENTION", "ESCALATED"):
        with pytest.raises(InvalidStateTransitionError):
            repository.update_debt_status(debt["id"], invented)
    assert repository.get_debt(debt["id"])["status"] == "CLEAR"


def test_llm_cannot_skip_straight_from_suspected_to_repaid(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    drive_to(debt["id"], "SUSPECTED")
    with pytest.raises(InvalidStateTransitionError):
        repository.update_debt_status(debt["id"], "REPAID")


# --------------------------------------------------------------------------
# regression claims are equally protected
# --------------------------------------------------------------------------

def test_regression_without_evidence_is_rejected(ids):
    did = _repaid_debt(ids)
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(did, "REGRESSED")  # no failing evidence
    assert repository.get_debt(did)["status"] == "REPAID"

    # with real failing evidence it is allowed
    repository.update_debt_status(
        did, "REGRESSED", evidence_id=failing_evidence(ids["student_id"], ids["pointers_id"])
    )
    assert repository.get_debt(did)["status"] == "REGRESSED"


def test_passing_evidence_cannot_trigger_regression(ids):
    did = _repaid_debt(ids)
    ev_id = fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    with pytest.raises(DebtVerificationError):
        repository.update_debt_status(did, "REGRESSED", evidence_id=ev_id)


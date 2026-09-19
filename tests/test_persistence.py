"""Persistence: the agent must remember everything across sessions.

Repository calls without `session` each open+commit+close their own session,
so simply writing and then re-reading already exercises cross-session
persistence (the in-memory engine is shared via StaticPool).
"""

import pytest
from sqlalchemy import select

from database import repository
from database.models import Debt, DebtStatus, Severity, Student

from tests.helpers import drive_to, fresh_passing_evidence


def test_write_close_reopen_read(ids):
    """Write via repository-created sessions, then read through a brand-new
    explicit session — everything must still be there."""
    student = repository.create_student("P001", "Persistent Petra")
    repository.add_evidence(student["id"], ids["pointers_id"], "quiz", 42.0, False)
    repository.add_evidence(student["id"], ids["pointers_id"], "coding", 30.0, False)
    debt = repository.detect_and_confirm_debt(student["id"], ids["pointers_id"])

    session = repository._new_session()  # a session the repo did NOT use
    try:
        row = session.scalar(select(Student).where(Student.external_id == "P001"))
        assert row is not None
        assert row.name == "Persistent Petra"
        debts = session.scalars(select(Debt)).all()
        assert len(debts) == 1
        assert debts[0].status is DebtStatus.CONFIRMED_DEBT
        assert debts[0].severity is Severity.HIGH
    finally:
        session.close()

    assert repository.get_debt(debt["id"])["status"] == "CONFIRMED_DEBT"
    history = repository.get_evidence_history(student["id"], ids["pointers_id"])
    assert [h["score"] for h in history] == [42.0, 30.0]


def test_caller_owned_session_round_trip(ids, session_factory):
    """Functions also accept a caller-owned session (the FastAPI pattern):
    nothing is committed until the caller commits."""
    session = session_factory()
    try:
        created = repository.create_student("P002", "Session Owner", session=session)
        repository.add_evidence(
            created["id"], ids["pointers_id"], "quiz", 55.0, False, session=session
        )
        session.commit()
    finally:
        session.close()

    assert repository.get_student(external_id="P002")["name"] == "Session Owner"
    assert len(repository.get_evidence_history(created["id"], ids["pointers_id"])) == 1


def test_uncommitted_caller_session_leaves_no_trace(ids, session_factory):
    session = session_factory()
    try:
        repository.create_student("P003", "Ghost", session=session)
        session.rollback()
    finally:
        session.close()
    assert repository.get_student(external_id="P003") is None


def test_debt_history_survives_across_sessions(ids):
    """The full V1 → failure → V2 → REPAID story must still be readable
    after every writing session has been closed."""
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    did = debt["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"style": "explanation + MCQs"})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
    repository.update_debt_status(did, "FAILED")
    repository.update_debt_status(did, "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V2", {"style": "memory diagrams + tracing"})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
    repository.update_debt_status(
        did, "REPAID", evidence_id=fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    )

    reopened = repository.get_debt(did)
    assert reopened["status"] == "REPAID"
    assert reopened["attempts"] == 2
    assert reopened["failed_interventions"] == 1
    assert [i["version"] for i in repository.get_interventions(did)] == ["V1", "V2"]


def test_audit_log_persists(ids):
    debt = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])
    repository.update_debt_status(debt["id"], "SUSPECTED")
    events = repository.get_events(ids["student_id"])
    types = [e["event_type"] for e in events]
    assert "DEBT_CREATED" in types
    assert "DEBT_STATUS_TRANSITION" in types
    assert "EVIDENCE_RECORDED" not in types  # nothing was recorded in this test

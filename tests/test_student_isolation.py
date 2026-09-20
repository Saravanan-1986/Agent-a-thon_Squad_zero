"""
Multi-Student Data Isolation Security Unit Tests

Verifies strict database-level separation of student performance, evidence,
knowledge debts, and interventions.
"""

import pytest
from database import repository
from database.models import DebtStatus


def test_student_data_isolation(db_engine):
    """Test that Student A's evidence and debts do not pollute Student B's profile."""
    # 1. Create two distinct students
    student_a = repository.create_student(external_id="alice@example.com", name="Alice")
    student_b = repository.create_student(external_id="bob@example.com", name="Bob")

    concept = repository.get_or_create_concept(name="Memory Allocation", category="Pointers")
    cid = concept["id"]

    # 2. Add failing evidence ONLY for Student A
    ev_a1 = repository.add_evidence(student_a["id"], cid, source="quiz", score=0.0, passed=False)
    ev_a2 = repository.add_evidence(student_a["id"], cid, source="quiz", score=20.0, passed=False)

    # 3. Check evidence histories
    history_a = repository.get_evidence_history(student_a["id"], cid)
    history_b = repository.get_evidence_history(student_b["id"], cid)

    assert len(history_a) == 2, "Student A must have 2 evidence records"
    assert len(history_b) == 0, "Student B must have 0 evidence records"

    # 4. Create debt for Student A
    debt_a = repository.get_or_create_debt(student_a["id"], cid)
    repository.update_debt_status(debt_a["id"], DebtStatus.SUSPECTED)
    repository.update_debt_status(debt_a["id"], DebtStatus.CONFIRMED_DEBT)

    # 5. Check debt ledgers
    ledger_a = repository.get_debt_ledger(student_a["id"])
    ledger_b = repository.get_debt_ledger(student_b["id"])

    assert len(ledger_a) == 1, "Student A should have 1 active debt in ledger"
    assert len(ledger_b) == 0, "Student B should have 0 debts in ledger"
    assert ledger_a[0]["student_id"] == student_a["id"]

    # 6. Check Knowledge Profile isolation
    profile_a = repository.get_student_knowledge_profile(student_a["id"])
    profile_b = repository.get_student_knowledge_profile(student_b["id"])

    assert profile_a["knowledge_status"] == "Assessed"
    assert profile_a["total_evidence_count"] == 2
    assert profile_a["active_debts_count"] == 1

    assert profile_b["knowledge_status"] == "Not assessed yet"
    assert profile_b["total_evidence_count"] == 0
    assert profile_b["active_debts_count"] == 0
    assert profile_b["overall_debt_score"] == 0.0


def test_leetcode_profile_isolation(db_engine):
    """Test LeetCode profiles and submissions remain strictly mapped per student."""
    student_a = repository.create_student(external_id="alice_lc@example.com", name="Alice LC")
    student_b = repository.create_student(external_id="bob_lc@example.com", name="Bob LC")

    profile_a = repository.save_leetcode_profile(
        student_id=student_a["id"],
        username="alice_leetcode",
        total_solved=150,
        easy_solved=80,
        medium_solved=60,
        hard_solved=10,
    )

    fetch_a = repository.get_leetcode_profile(student_a["id"])
    fetch_b = repository.get_leetcode_profile(student_b["id"])

    assert fetch_a is not None
    assert fetch_a["username"] == "alice_leetcode"
    assert fetch_b is None, "Student B should have no LeetCode profile yet"

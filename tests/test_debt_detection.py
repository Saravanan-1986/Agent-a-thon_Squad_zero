"""Debt detection at the repository boundary.

The real Evidence Agent threshold logic lives in backend/agents/ (Member 3);
here we test the deterministic stub (repository.detect_and_confirm_debt):
multiple weak signals confirm a debt, a single weak signal never does.
"""

from database import repository


def test_single_weak_evidence_never_confirms_a_debt(ids):
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 35.0, False)
    assert repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"]) is None
    assert repository.get_debt_ledger(ids["student_id"]) == []


def test_spec_pattern_42_fail_45_confirms_high_severity(ids):
    """The canonical example: Pointers quiz 42%, coding FAIL, follow-up 45%
    → CONFIRMED_DEBT with HIGH severity (avg 39 < 45)."""
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 42.0, False)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "coding", 30.0, False)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "follow_up", 45.0, False)

    debt = repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"])
    assert debt is not None
    assert debt["status"] == "CONFIRMED_DEBT"
    assert debt["severity"] == "HIGH"

    ledger = repository.get_debt_ledger(ids["student_id"])
    assert len(ledger) == 1
    assert ledger[0]["status"] == "CONFIRMED_DEBT"
    assert ledger[0]["concept_name"] == "Pointers"


def test_moderate_weakness_is_medium_severity(ids):
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 58.0, False)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 56.0, False)
    debt = repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"])
    assert debt["status"] == "CONFIRMED_DEBT"
    assert debt["severity"] == "MEDIUM"  # avg 57: weak (below 60) but not HIGH (below 45)


def test_strong_evidence_never_creates_a_debt(ids):
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 85.0, True)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "coding", 90.0, True)
    assert repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"]) is None
    assert repository.get_debt_ledger(ids["student_id"]) == []


def test_detection_is_idempotent_and_never_duplicates(ids):
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 42.0, False)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "coding", 30.0, False)
    first = repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"])
    second = repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"])
    assert first["id"] == second["id"]
    assert second["status"] == "CONFIRMED_DEBT"
    assert len(repository.get_debt_ledger(ids["student_id"])) == 1


def test_debts_are_scoped_per_concept(ids):
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 42.0, False)
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "coding", 30.0, False)
    repository.detect_and_confirm_debt(ids["student_id"], ids["pointers_id"])
    # Arrays has healthy evidence → must NOT appear in the ledger
    repository.add_evidence(ids["student_id"], ids["arrays_id"], "quiz", 91.0, True)
    repository.detect_and_confirm_debt(ids["student_id"], ids["arrays_id"])
    ledger = repository.get_debt_ledger(ids["student_id"])
    assert [e["concept_name"] for e in ledger] == ["Pointers"]

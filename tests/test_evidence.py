"""Evidence recording rules — the raw material of the engine."""

import pytest

from database import repository


def test_add_evidence_stores_the_record(ids):
    row = repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 42.0, False)
    assert row["id"] > 0
    assert row["source"] == "quiz"
    assert row["score"] == 42.0
    assert row["passed"] is False
    assert row["timestamp"] is not None


def test_evidence_history_is_oldest_first(ids):
    for score in (55.0, 30.0, 45.0):
        repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", score, False)
    history = repository.get_evidence_history(ids["student_id"], ids["pointers_id"])
    assert [h["score"] for h in history] == [55.0, 30.0, 45.0]


def test_history_is_scoped_to_student_and_concept(ids):
    other = repository.create_student("S002", "Other Student")
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 40.0, False)
    repository.add_evidence(other["id"], ids["pointers_id"], "quiz", 90.0, True)
    repository.add_evidence(ids["student_id"], ids["arrays_id"], "quiz", 95.0, True)
    history = repository.get_evidence_history(ids["student_id"], ids["pointers_id"])
    assert len(history) == 1
    assert history[0]["score"] == 40.0


def test_single_evidence_does_not_create_a_debt(ids):
    """A single wrong answer is NOT knowledge debt: add_evidence must never
    create debt rows as a side effect."""
    repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 10.0, False)
    assert repository.get_debt_ledger(ids["student_id"]) == []


def test_unknown_source_is_rejected(ids):
    with pytest.raises(ValueError):
        repository.add_evidence(ids["student_id"], ids["pointers_id"], "twitter", 50.0, True)


def test_out_of_range_score_is_rejected(ids):
    with pytest.raises(ValueError):
        repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", 150.0, True)
    with pytest.raises(ValueError):
        repository.add_evidence(ids["student_id"], ids["pointers_id"], "quiz", -5.0, False)


def test_all_spec_sources_are_accepted(ids):
    for source in ("quiz", "coding", "follow_up", "leetcode"):
        row = repository.add_evidence(ids["student_id"], ids["pointers_id"], source, 60.0, True)
        assert row["source"] == source

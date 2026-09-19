"""CRUD tests for students."""

import pytest

from database import repository
from database.state_machine import KnowledgeDebtError


def test_create_student_returns_dict_shape():
    student = repository.create_student("S001", "Priya Sharma")
    assert student["id"] > 0
    assert student["external_id"] == "S001"
    assert student["name"] == "Priya Sharma"
    assert student["created_at"] is not None


def test_get_student_by_id_and_by_external_id():
    created = repository.create_student("S002", "Marcus Chen")
    by_id = repository.get_student(created["id"])
    by_external = repository.get_student(external_id="S002")
    assert by_id == by_external == created


def test_get_missing_student_returns_none():
    assert repository.get_student(99999) is None
    assert repository.get_student(external_id="NOPE") is None


def test_duplicate_external_id_is_rejected():
    repository.create_student("S100", "First")
    with pytest.raises(KnowledgeDebtError):
        repository.create_student("S100", "Second")


def test_get_student_requires_a_key():
    with pytest.raises(ValueError):
        repository.get_student()


def test_unknown_student_is_rejected_when_referenced(ids):
    with pytest.raises(KnowledgeDebtError):
        repository.add_evidence(424242, ids["pointers_id"], "quiz", 50.0, True)

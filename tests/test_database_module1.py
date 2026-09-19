"""
Unit tests for Module 1 database repository extensions.
Covers Subjects, Questions, Assessments, Student Responses, and Graph Traversals.
"""

from __future__ import annotations

import pytest
from database import repository


def test_subject_crud():
    sub = repository.create_subject(
        code="TEST-DBMS",
        title="Test Database Management",
        description="Test description",
    )
    assert sub["id"] is not None
    assert sub["code"] == "TEST-DBMS"
    assert sub["title"] == "Test Database Management"

    fetched = repository.get_subject(sub["id"])
    assert fetched is not None
    assert fetched["code"] == "TEST-DBMS"

    fetched_by_code = repository.get_subject_by_code("TEST-DBMS")
    assert fetched_by_code is not None
    assert fetched_by_code["id"] == sub["id"]

    subjects = repository.list_subjects()
    assert any(s["code"] == "TEST-DBMS" for s in subjects)


def test_concept_and_prerequisite_graph():
    sub = repository.create_subject("CS-GRAPH", "Graph Subject")
    c1 = repository.get_or_create_concept(
        name="Graph-Concept-1",
        code="C1",
        category="CatA",
        subject_id=sub["id"],
    )
    c2 = repository.get_or_create_concept(
        name="Graph-Concept-2",
        code="C2",
        category="CatA",
        subject_id=sub["id"],
    )
    c3 = repository.get_or_create_concept(
        name="Graph-Concept-3",
        code="C3",
        category="CatB",
        subject_id=sub["id"],
    )

    # C3 -> C2 -> C1
    repository.add_prerequisite(c2["id"], c1["id"], relationship_type="requires", strength=1.0)
    repository.add_prerequisite(c3["id"], c2["id"], relationship_type="requires", strength=0.9)

    # Test direct prerequisites
    prereqs = repository.get_concept_prerequisites(c2["id"])
    assert len(prereqs) == 1
    assert prereqs[0]["id"] == c1["id"]

    # Test prerequisite chain for C3
    chain = repository.get_prerequisite_chain(c3["id"])
    assert len(chain) == 2
    chain_ids = [c["id"] for c in chain]
    assert chain_ids == [c1["id"], c2["id"]]

    # Test cycle detection (no cycle)
    cycles = repository.detect_prerequisite_cycles()
    assert len(cycles) == 0

    # Introduce a cycle: C1 -> C3
    repository.add_prerequisite(c1["id"], c3["id"])
    cycles_found = repository.detect_prerequisite_cycles()
    assert len(cycles_found) > 0


def test_question_crud():
    sub = repository.create_subject("Q-SUB", "Question Subject")
    c = repository.get_or_create_concept("Q-Concept", code="QC1", subject_id=sub["id"])

    q = repository.create_question(
        question_code="Q-TEST-001",
        subject_id=sub["id"],
        concept_id=c["id"],
        difficulty_label="medium",
        difficulty_score=0.55,
        question_type="MCQ",
        question_text="What is 2 + 2?",
        options=["2", "3", "4", "5"],
        correct_answer="4",
        explanation="2 + 2 equals 4.",
        skill_tags=["Math", "Basic"],
        estimated_time_seconds=30,
        source_reference="Basic Arithmetic Textbook",
    )

    assert q["id"] is not None
    assert q["question_code"] == "Q-TEST-001"
    assert q["difficulty_score"] == 0.55
    assert q["options"] == ["2", "3", "4", "5"]

    fetched = repository.get_question(q["id"])
    assert fetched["question_code"] == "Q-TEST-001"

    by_code = repository.get_question_by_code("Q-TEST-001")
    assert by_code["id"] == q["id"]

    c_questions = repository.list_questions_by_concept(c["id"])
    assert len(c_questions) == 1
    assert c_questions[0]["question_code"] == "Q-TEST-001"

    s_questions = repository.list_questions_by_subject(sub["id"])
    assert len(s_questions) == 1


def test_assessment_and_attempt():
    sub = repository.create_subject("ASSESS-SUB", "Assessment Subject")
    c = repository.get_or_create_concept("Assess-Concept", code="AC1", subject_id=sub["id"])
    q = repository.create_question(
        question_code="Q-ASSESS-001",
        subject_id=sub["id"],
        concept_id=c["id"],
        difficulty_label="easy",
        difficulty_score=0.25,
        question_type="TRUE_FALSE",
        question_text="Is SQLite a relational database?",
        options=["True", "False"],
        correct_answer="True",
        explanation="SQLite is a serverless relational database engine.",
    )

    assessment = repository.create_assessment(
        subject_id=sub["id"],
        title="DBMS Diagnostic",
        type="diagnostic",
        description="Diagnostic test",
    )
    assert assessment["id"] is not None

    repository.add_question_to_assessment(assessment["id"], q["id"], sequence_order=1)

    fetched_assess = repository.get_assessment(assessment["id"])
    assert fetched_assess["total_questions"] == 1
    assert len(fetched_assess["questions"]) == 1
    assert fetched_assess["questions"][0]["question_code"] == "Q-ASSESS-001"

    student = repository.create_student("S-TEST-101", "Test Student")
    attempt = repository.create_assessment_attempt(student["id"], assessment["id"])
    assert attempt["status"] == "in_progress"

    resp = repository.record_student_response(
        student_id=student["id"],
        concept_id=c["id"],
        attempt_id=attempt["id"],
        question_id=q["id"],
        selected_answer="True",
        is_correct=True,
        score=100.0,
        response_time_seconds=12.5,
        question_difficulty=0.25,
        question_type="TRUE_FALSE",
    )
    assert resp["id"] is not None
    assert resp["is_correct"] is True
    assert resp["score"] == 100.0

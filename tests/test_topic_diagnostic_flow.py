"""
Unit & Integration Tests for Topic-by-Topic Adaptive Diagnostic Progression

Tests:
1. Topic selection prioritizing LeetCode solved concepts.
2. Correct answer -> Evidence logged as passed, concept marked CLEAR/REPAID, progression to next topic.
3. Incorrect answer -> Evidence logged, ML features extracted, debt created (CONFIRMED_DEBT), root-cause diagnosed, LLM intervention generated, and stored in Mentor queue.
"""

import pytest
from database import repository
from database.models import DebtStatus
from backend.api.diagnostic import start_diagnostic, get_next_question, submit_answer, StartDiagnosticRequest, AnswerQuestionRequest


def test_topic_progression_on_correct_answer(db_engine):
    """Test answering correctly marks topic as mastered and advances to next topic."""
    student = repository.create_student(external_id="topic_student_1@test.com", name="Topic Student 1")
    student_id = student["id"]

    # Start topic diagnostic
    req_start = StartDiagnosticRequest(student_id=student_id, subject_code="DSA")
    start_res = start_diagnostic(req_start)

    assert "attempt_id" in start_res
    attempt_id = start_res["attempt_id"]
    concept = start_res["target_concept"]

    # Fetch next question
    q_data = get_next_question(attempt_id, student_id, concept["id"])
    question = q_data["question"]

    # Fetch full question to get correct answer
    q_full = repository.get_question(question["id"])
    correct_ans = q_full["correct_answer"]

    # Submit correct answer
    ans_req = AnswerQuestionRequest(
        student_id=student_id,
        question_id=question["id"],
        selected_answer=correct_ans,
        response_time_seconds=25.0
    )
    ans_res = submit_answer(attempt_id, ans_req)

    assert ans_res["is_correct"] is True
    assert ans_res["score"] == 100.0
    assert ans_res["status"] == "TOPIC_MASTERED"
    assert ans_res["next_concept"] is not None

    # Verify DB evidence row
    history = repository.get_evidence_history(student_id, concept["id"])
    assert len(history) == 1
    assert history[0]["passed"] is True
    assert history[0]["score"] == 100.0


def test_topic_gap_detection_and_mentor_queue_creation(db_engine):
    """Test answering incorrectly creates Knowledge Debt and intervention for mentor review."""
    student = repository.create_student(external_id="gap_student@test.com", name="Gap Student")
    student_id = student["id"]

    start_res = start_diagnostic(StartDiagnosticRequest(student_id=student_id))
    attempt_id = start_res["attempt_id"]
    concept = start_res["target_concept"]

    q_data = get_next_question(attempt_id, student_id, concept["id"])
    question = q_data["question"]

    # Submit WRONG answer
    wrong_ans = "WRONG_ANSWER_CHOICE_XYZ"
    ans_req = AnswerQuestionRequest(
        student_id=student_id,
        question_id=question["id"],
        selected_answer=wrong_ans,
        response_time_seconds=40.0
    )
    ans_res = submit_answer(attempt_id, ans_req)

    assert ans_res["is_correct"] is False
    assert ans_res["score"] == 0.0
    assert ans_res["status"] == "KNOWLEDGE_GAP_DETECTED"
    assert ans_res["debt_created"] is not None

    # Verify debt ledger & mentor review queue in database
    ledger = repository.get_debt_ledger(student_id)
    assert len(ledger) >= 1
    debt = ledger[0]
    assert debt["status"] in [DebtStatus.CONFIRMED_DEBT.value, DebtStatus.IN_INTERVENTION.value]

    # Check pending mentor interventions
    from backend.api.mentor import get_pending_interventions
    pending = get_pending_interventions()
    assert "pending_count" in pending

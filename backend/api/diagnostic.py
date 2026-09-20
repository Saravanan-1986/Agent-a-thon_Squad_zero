"""
Adaptive Diagnostic API Router.

Provides 1-question-at-a-time dynamic question selection, response persistence,
evidence generation, ML feature extraction, and deterministic debt detection.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from database import repository
from database.models import DebtStatus
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention

router = APIRouter(prefix="/diagnostic", tags=["Adaptive Diagnostic"])


class StartDiagnosticRequest(BaseModel):
    student_id: int
    subject_code: str = "DSA"


class AnswerQuestionRequest(BaseModel):
    student_id: int
    question_id: int
    selected_answer: Any
    response_time_seconds: float = 30.0


@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_diagnostic(payload: StartDiagnosticRequest) -> Dict[str, Any]:
    """Start a topic-by-topic adaptive diagnostic attempt for a student."""
    user = repository.get_student(payload.student_id)
    if not user:
        try:
            user = repository.create_student(external_id=f"student_{payload.student_id}", name=f"Student {payload.student_id}")
        except Exception:
            pass

    subject = repository.get_subject_by_code(payload.subject_code)
    if not subject:
        subject = repository.create_subject(code="DSA", title="Data Structures and Algorithms")

    assessment = repository.create_assessment(
        subject_id=subject["id"],
        title=f"{subject['code']} Adaptive Topic Diagnostic",
        type="diagnostic",
        description="Dynamic database-driven topic-by-topic adaptive assessment.",
    )

    attempt = repository.create_assessment_attempt(
        student_id=payload.student_id, assessment_id=assessment["id"]
    )

    # Determine initial concept prioritizing LeetCode solved topics
    target_concept = repository.get_next_unassessed_concept(payload.student_id)
    if not target_concept:
        target_concept = repository.get_or_create_concept(name="Array Traversal", category="Arrays", difficulty_baseline=0.3)

    # Audit trace event
    repository.record_event(
        payload.student_id,
        "TOPIC_SELECTED",
        {"concept_id": target_concept["id"], "concept_name": target_concept["name"], "attempt_id": attempt["id"]},
    )

    return {
        "message": "Topic diagnostic started successfully",
        "attempt_id": attempt["id"],
        "student_id": payload.student_id,
        "subject_code": payload.subject_code,
        "target_concept": target_concept,
    }


@router.get("/{attempt_id}/next")
def get_next_question(attempt_id: int, student_id: int, concept_id: Optional[int] = None) -> Dict[str, Any]:
    """Select the next suitable database question for the student's current or next topic."""
    user = repository.get_student(student_id)
    if not user:
        try:
            user = repository.create_student(external_id=f"student_{student_id}", name=f"Student {student_id}")
        except Exception:
            pass

    # Select concept
    if concept_id:
        target_concept = repository.get_concept(concept_id)
    else:
        target_concept = repository.get_next_unassessed_concept(student_id)

    if not target_concept:
        target_concept = repository.get_or_create_concept(name="Array Traversal", category="Arrays")

    cid = target_concept["id"]

    # Fetch active questions for concept from database item bank
    all_questions = repository.list_questions_by_concept(cid)
    if not all_questions:
        all_questions = repository.list_questions_by_subject(1)

    if not all_questions:
        q_default = repository.create_question(
            question_code=f"Q-DIAG-{cid}-001",
            subject_id=1,
            concept_id=cid,
            difficulty_label="easy",
            difficulty_score=0.3,
            question_type="MCQ",
            question_text=f"What is the time complexity of operation on {target_concept['name']}?",
            options=["O(1)", "O(log n)", "O(n)", "O(n^2)"],
            correct_answer="O(n)",
            explanation=f"Standard sequential operation on {target_concept['name']} requires scanning elements in O(n) time.",
            source_reference="Database Item Bank"
        )
        all_questions = [q_default]


    # Find questions already answered by student for this attempt/concept
    responses = repository.list_student_responses(student_id, concept_id=cid, attempt_id=attempt_id)
    answered_qids = {r["question_id"] for r in responses}

    # Filter for unanswered questions
    unanswered = [q for q in all_questions if q["id"] not in answered_qids]

    if unanswered:
        selected_q = unanswered[0]
    else:
        # If all answered in this attempt, pick first question or cycle
        selected_q = all_questions[len(responses) % len(all_questions)]

    repository.record_event(
        student_id,
        "QUESTION_SELECTED",
        {"attempt_id": attempt_id, "question_id": selected_q["id"], "concept_id": cid, "concept_name": target_concept["name"]},
    )

    sanitized = dict(selected_q)
    sanitized.pop("correct_answer", None)
    sanitized.pop("explanation", None)

    return {
        "attempt_id": attempt_id,
        "concept": target_concept,
        "question": sanitized,
        "topic_questions_answered": len(responses),
        "total_topic_questions": min(10, max(len(all_questions), 1)),
    }


@router.post("/{attempt_id}/answer")
def submit_answer(attempt_id: int, payload: AnswerQuestionRequest) -> Dict[str, Any]:
    """Process single question answer topic-by-topic, update DB evidence, run ML model, and update mentor queue."""
    student_id = payload.student_id
    q = repository.get_question(payload.question_id)
    if not q:
        raise HTTPException(status_code=404, detail=f"Question ID {payload.question_id} not found.")

    cid = q["concept_id"]
    expected = q["correct_answer"]
    user_ans = payload.selected_answer

    if isinstance(expected, str) and isinstance(user_ans, str):
        is_correct = user_ans.strip().lower() == expected.strip().lower()
    else:
        is_correct = user_ans == expected

    score = 100.0 if is_correct else 0.0

    # 1. Store StudentResponse in DB
    sr = repository.record_student_response(
        student_id=student_id,
        concept_id=cid,
        attempt_id=attempt_id,
        question_id=q["id"],
        selected_answer=user_ans,
        is_correct=is_correct,
        score=score,
        response_time_seconds=payload.response_time_seconds,
        question_difficulty=q["difficulty_score"],
        question_type=q["question_type"],
    )

    # 2. Store Evidence signal in DB
    ev = repository.add_evidence(
        student_id=student_id,
        concept_id=cid,
        source="quiz",
        score=score,
        passed=is_correct,
    )

    # Emit audit events
    repository.record_event(
        student_id,
        "ANSWER_SUBMITTED",
        {"question_id": q["id"], "concept_id": cid, "is_correct": is_correct, "score": score},
    )
    repository.record_event(
        student_id,
        "EVIDENCE_CREATED",
        {"evidence_id": ev["id"], "source": "quiz", "passed": is_correct, "score": score},
    )

    # 3. Extract ML features & predict knowledge gap
    features = extract_student_concept_features(student_id, cid)
    ml_res = predict_knowledge_gap(cid, features)
    gap_prob = ml_res["knowledge_gap_probability"]

    repository.record_event(
        student_id,
        "KNOWLEDGE_GAP_ESTIMATED",
        {"concept_id": cid, "gap_probability": gap_prob},
    )

    # Calculate student accuracy for this topic in this attempt
    topic_responses = repository.list_student_responses(student_id, concept_id=cid, attempt_id=attempt_id)
    topic_count = len(topic_responses)
    correct_count = sum(1 for r in topic_responses if r["is_correct"])
    topic_acc = (correct_count / topic_count) if topic_count > 0 else (1.0 if is_correct else 0.0)

    # 80% pass mark threshold check
    pass_mark_achieved = topic_acc >= 0.80

    all_topic_q = repository.list_questions_by_concept(cid)
    max_q_for_topic = min(10, max(len(all_topic_q), 1))

    # Check if topic evaluation for 10 questions is complete or failed early
    if topic_count >= max_q_for_topic or not is_correct or pass_mark_achieved:
        next_concept = repository.get_next_unassessed_concept(student_id, cid)
    else:
        # Continue asking remaining questions for this topic
        next_concept = repository.get_concept(cid)

    debt_created = None

    if pass_mark_achieved or (is_correct and topic_count == 1):
        # Correct answer & pass mark met: clear/repay debt if existing, record topic mastery progress
        debt = repository.get_or_create_debt(student_id, cid)
        if debt and debt.get("status") in [DebtStatus.CONFIRMED_DEBT.value, DebtStatus.IN_INTERVENTION.value]:
            try:
                repository.update_debt_status(debt["id"], DebtStatus.REPAID, evidence_id=ev["id"])
            except Exception:
                pass

        repository.record_event(
            student_id,
            "TOPIC_MASTERED",
            {"concept_id": cid, "accuracy": topic_acc, "next_concept": next_concept},
        )
        status_message = "TOPIC_MASTERED"
    else:
        # Knowledge gap detected (< 80% or wrong answer): create debt, diagnose root cause, generate intervention
        debt = repository.get_or_create_debt(student_id, cid)
        debt_id = debt["id"]

        if debt.get("status") in [DebtStatus.CLEAR.value, DebtStatus.SUSPECTED.value]:
            if debt.get("status") == DebtStatus.CLEAR.value:
                repository.update_debt_status(debt_id, DebtStatus.SUSPECTED)
            debt = repository.update_debt_status(debt_id, DebtStatus.CONFIRMED_DEBT)
            repository.update_debt_severity(debt_id, "HIGH" if score < 40.0 else "MEDIUM")

        # Root-cause analysis & LLM intervention generation
        history = repository.get_evidence_history(student_id, cid)
        prereqs = repository.get_concept_prerequisites(cid)
        diagnosis = diagnose_root_cause(student_id, cid, history, prereqs)

        int_content = generate_intervention(
            debt_id=debt_id,
            concept_id=cid,
            root_cause_id=diagnosis.likely_root_cause,
            previous_versions=[],
        )
        rec_int = repository.record_intervention(debt_id, "V1", int_content)

        if debt.get("status") == DebtStatus.CONFIRMED_DEBT.value:
            repository.update_debt_status(debt_id, DebtStatus.INTERVENTION_PROPOSED)
            repository.update_debt_status(debt_id, DebtStatus.MENTOR_REVIEW)
            repository.record_mentor_review(rec_int["id"], "approved")
            debt = repository.update_debt_status(debt_id, DebtStatus.IN_INTERVENTION)

        repository.record_event(student_id, "DEBT_CREATED", {"debt_id": debt_id, "concept_id": cid})
        repository.record_event(student_id, "INTERVENTION_CREATED", {"debt_id": debt_id, "intervention_id": rec_int["id"]})

        debt_created = {
            "debt_id": debt_id,
            "concept_id": cid,
            "status": "IN_INTERVENTION",
            "root_cause": diagnosis.model_dump(),
            "intervention": rec_int,
        }
        status_message = "KNOWLEDGE_GAP_DETECTED"

    return {
        "student_id": student_id,
        "attempt_id": attempt_id,
        "question_id": q["id"],
        "concept_id": cid,
        "is_correct": is_correct,
        "score": score,
        "topic_accuracy": round(topic_acc * 100, 1),
        "pass_mark_achieved": pass_mark_achieved,
        "status": status_message,
        "explanation": q["explanation"],
        "knowledge_gap_probability": gap_prob,
        "debt_created": debt_created,
        "next_concept": next_concept,
    }


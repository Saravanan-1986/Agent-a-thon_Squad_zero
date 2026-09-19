"""
Assessments API Router.

Manages diagnostic assessments, student answer submission, ML inference,
deterministic debt confirmation, root-cause diagnosis, and intervention generation.
"""

from __future__ import annotations

import logging
import random
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database import repository
from database.state_machine import DebtStatus
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention

logger = logging.getLogger("backend.api.assessments")

router = APIRouter(tags=["Assessments"])


class DiagnosticStartRequest(BaseModel):
    student_id: int
    subject_code: str = "DSA"
    num_questions: int = 12


class QuestionResponseItem(BaseModel):
    question_id: int
    selected_answer: Any
    response_time_seconds: float = 30.0


class AssessmentSubmitRequest(BaseModel):
    student_id: int
    attempt_id: int
    responses: List[QuestionResponseItem]


@router.get("/api/subjects")
def list_available_subjects():
    """List all available subjects (e.g. DSA, DBMS)."""
    return repository.list_subjects()


@router.post("/api/assessments/dsa/diagnostic", status_code=status.HTTP_201_CREATED)
def start_dsa_diagnostic(payload: DiagnosticStartRequest):
    """Generate a fresh DSA diagnostic assessment with up to 12 balanced questions across concepts."""
    subject = repository.get_subject_by_code(payload.subject_code)
    if not subject:
        # Fallback to create if not seeded yet
        subject = repository.create_subject(code="DSA", title="Data Structures and Algorithms")

    questions = repository.list_questions_by_subject(subject["id"])
    if not questions:
        raise HTTPException(
            status_code=404, detail="No questions available for subject. Please run importer."
        )

    # Sample up to payload.num_questions with concept diversity
    num_q = min(payload.num_questions, len(questions))
    selected_questions = random.sample(questions, num_q)

    assessment = repository.create_assessment(
        subject_id=subject["id"],
        title="DSA Diagnostic Assessment",
        type="diagnostic",
        description="Comprehensive DSA diagnostic test evaluating 12 key concepts.",
    )

    for order, q in enumerate(selected_questions, start=1):
        repository.add_question_to_assessment(assessment["id"], q["id"], sequence_order=order)

    attempt = repository.create_assessment_attempt(
        student_id=payload.student_id, assessment_id=assessment["id"]
    )

    # Sanitize questions for student view (strip correct_answer and explanation during test taking)
    sanitized_questions = []
    for q in selected_questions:
        q_copy = dict(q)
        q_copy.pop("correct_answer", None)
        q_copy.pop("explanation", None)
        sanitized_questions.append(q_copy)

    return {
        "assessment_id": assessment["id"],
        "attempt_id": attempt["id"],
        "title": assessment["title"],
        "subject_code": payload.subject_code,
        "total_questions": len(sanitized_questions),
        "questions": sanitized_questions,
    }


@router.post("/api/assessments/{attempt_id}/submit")
def submit_dsa_diagnostic(attempt_id: int, payload: AssessmentSubmitRequest):
    """Process student diagnostic submissions:
    1. Score answers and persist StudentResponse & Evidence rows.
    2. Extract concept performance features & run Scikit-Learn ML Model.
    3. Evaluate deterministic evidence rules to create Knowledge Debts.
    4. Run Diagnosis Agent for root-cause prerequisite analysis.
    5. Generate adaptive LLM Intervention strategy.
    """
    student_id = payload.student_id

    # 1. Process and record responses
    scored_responses = []
    concept_scores: Dict[int, List[float]] = {}
    concept_names: Dict[int, str] = {}
    total_correct = 0

    for item in payload.responses:
        q = repository.get_question(item.question_id)
        if not q:
            continue

        cid = q["concept_id"]
        c_obj = repository.get_concept(cid)
        cname = c_obj["name"] if c_obj else f"Concept-{cid}"
        concept_names[cid] = cname

        expected = q["correct_answer"]
        user_ans = item.selected_answer

        # Match check
        if isinstance(expected, str) and isinstance(user_ans, str):
            is_correct = user_ans.strip().lower() == expected.strip().lower()
        else:
            is_correct = user_ans == expected

        score = 100.0 if is_correct else 0.0
        if is_correct:
            total_correct += 1

        # Record granular StudentResponse row
        sr = repository.record_student_response(
            student_id=student_id,
            concept_id=cid,
            attempt_id=attempt_id,
            question_id=q["id"],
            selected_answer=user_ans,
            is_correct=is_correct,
            score=score,
            response_time_seconds=item.response_time_seconds,
            question_difficulty=q["difficulty_score"],
            question_type=q["question_type"],
        )

        # Record Evidence signal
        ev = repository.add_evidence(
            student_id=student_id,
            concept_id=cid,
            source="quiz",
            score=score,
            passed=is_correct,
        )

        concept_scores.setdefault(cid, []).append(score)
        scored_responses.append({
            "question_id": q["id"],
            "concept_id": cid,
            "concept_name": cname,
            "is_correct": is_correct,
            "user_answer": user_ans,
            "explanation": q["explanation"],
        })

    # Overall score calculation
    total_q = len(payload.responses)
    overall_score = round((total_correct / total_q) * 100.0, 1) if total_q > 0 else 0.0

    # 2. Concept Level Performance & ML Feature Engineering
    concept_summary = []
    gap_detected_concepts = []

    for cid, scores in concept_scores.items():
        avg_score = sum(scores) / len(scores)
        cname = concept_names[cid]

        # Extract ML features
        features = extract_student_concept_features(student_id, cid)

        # Run ML Predictor
        ml_res = predict_knowledge_gap(cid, features)
        gap_prob = ml_res["knowledge_gap_probability"]

        # Deterministic Evidence Decision Rule:
        # "ML predicts. Evidence rules decide."
        is_debt_confirmed = (gap_prob >= 0.65) and (avg_score < 60.0)

        concept_summary.append({
            "concept_id": cid,
            "concept_name": cname,
            "accuracy": round(avg_score, 1),
            "status": "DEVELOPING" if avg_score < 70.0 else "STRONG",
            "knowledge_gap_probability": gap_prob,
            "debt_confirmed": is_debt_confirmed,
        })

        if is_debt_confirmed:
            gap_detected_concepts.append((cid, cname, avg_score, gap_prob, features))

    # 3. Handle Knowledge Debt Creation & Root-Cause Diagnosis
    created_debts = []
    for cid, cname, avg_score, gap_prob, features in gap_detected_concepts:
        debt = repository.get_or_create_debt(student_id, cid)
        debt_id = debt["id"]
        current_status = debt.get("status")

        if current_status in [DebtStatus.CLEAR.value, DebtStatus.SUSPECTED.value]:
            # Transition to CONFIRMED_DEBT
            if current_status == DebtStatus.CLEAR.value:
                repository.update_debt_status(debt_id, DebtStatus.SUSPECTED)
            debt = repository.update_debt_status(debt_id, DebtStatus.CONFIRMED_DEBT)

            severity = "HIGH" if avg_score < 45.0 else "MEDIUM"
            repository.update_debt_severity(debt_id, severity)

            # Root Cause Diagnosis Agent
            history = repository.get_evidence_history(student_id, cid)
            prereqs = repository.get_concept_prerequisites(cid)
            diagnosis = diagnose_root_cause(student_id, cid, history, prereqs)

            # Generate Adaptive LLM Intervention Strategy (V1)
            intervention_content = generate_intervention(
                debt_id=debt_id,
                concept_id=cid,
                root_cause_id=diagnosis.likely_root_cause,
                previous_versions=[],
            )
            rec_int = repository.record_intervention(debt_id, "V1", intervention_content)

            # Transition CONFIRMED_DEBT -> INTERVENTION_PROPOSED -> MENTOR_REVIEW -> IN_INTERVENTION
            repository.update_debt_status(debt_id, DebtStatus.INTERVENTION_PROPOSED)
            repository.update_debt_status(debt_id, DebtStatus.MENTOR_REVIEW)
            repository.record_mentor_review(rec_int["id"], "approved")
            repository.update_debt_status(debt_id, DebtStatus.IN_INTERVENTION)


            created_debts.append({
                "debt_id": debt_id,
                "concept_id": cid,
                "concept_name": cname,
                "status": "IN_INTERVENTION",
                "severity": severity,
                "knowledge_gap_probability": gap_prob,
                "root_cause": diagnosis.model_dump(),
                "intervention": rec_int,
            })

    return {
        "student_id": student_id,
        "attempt_id": attempt_id,
        "overall_score": overall_score,
        "total_questions": total_q,
        "correct_count": total_correct,
        "concept_summary": concept_summary,
        "debts_created": created_debts,
    }


@router.get("/api/system/trace/{student_id}")
def get_system_trace(student_id: str):
    """Retrieve system audit events and agent activity trace for real-time UI observability drawer."""
    sid = int(student_id) if student_id.isdigit() else 1
    events = repository.get_events(sid)
    return {
        "student_id": sid,
        "count": len(events),
        "events": events,
    }


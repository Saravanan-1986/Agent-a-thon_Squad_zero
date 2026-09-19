"""
End-to-End Vertical Slice Integration Test for DSA Subject Domain.
Tests diagnostic test taking, ML prediction, deterministic decision engine,
root-cause diagnosis, LLM intervention generation, and evidence verification.
"""

import pytest
from database import repository
from database.state_machine import DebtStatus
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention

@pytest.fixture
def dsa_e2e_setup(session_factory):
    repository.session_factory = session_factory

    # 1. Create Student
    student = repository.create_student(external_id="e2e_student", name="E2E Student")

    # 2. Create Subject and Prerequisites
    subject = repository.create_subject(code="DSA_E2E", title="DSA E2E Test Subject")

    prereq_concept = repository.create_concept(
        code="E2E-MEM-001",
        subject_id=subject["id"],
        name="Memory Allocation Basics",
        category="Foundations"
    )

    target_concept = repository.create_concept(
        code="E2E-PTR-001",
        subject_id=subject["id"],
        name="Pointers & References",
        category="Memory"
    )

    repository.add_prerequisite(target_concept["id"], prereq_concept["id"], relationship_type="requires", strength=1.0)

    # 3. Create Questions
    q1 = repository.create_question(
        question_code="Q-PTR-001",
        subject_id=subject["id"],
        concept_id=target_concept["id"],
        difficulty_label="Medium",
        difficulty_score=0.6,
        question_type="MCQ",
        question_text="What is dereferencing a pointer?",
        correct_answer="Accessing the memory value stored at the pointer address",
        explanation="Dereferencing with * yields the value stored in memory.",
        options=[
            "Accessing the memory value stored at the pointer address",
            "Getting the memory address of a variable",
            "Deleting the variable",
            "Allocating new heap space"
        ]
    )

    yield {
        "student": student,
        "subject": subject,
        "prereq_concept": prereq_concept,
        "target_concept": target_concept,
        "question": q1
    }

    repository.session_factory = None

def test_full_dsa_vertical_slice(dsa_e2e_setup):
    setup = dsa_e2e_setup
    sid = setup["student"]["id"]
    cid = setup["target_concept"]["id"]
    qid = setup["question"]["id"]

    # Step 1: Simulate student failing diagnostic question
    sr = repository.record_student_response(
        student_id=sid,
        concept_id=cid,
        question_id=qid,
        selected_answer="Getting the memory address of a variable", # Incorrect
        is_correct=False,
        score=0.0,
        response_time_seconds=25.0
    )
    assert sr["is_correct"] is False

    # Log evidence
    ev = repository.add_evidence(sid, cid, "quiz", score=0.0, passed=False)
    assert ev["passed"] is False

    # Log second failing evidence to trigger threshold
    ev2 = repository.add_evidence(sid, cid, "quiz", score=30.0, passed=False)

    # Step 2: ML Feature Extraction & Inference
    features = extract_student_concept_features(sid, cid)
    ml_res = predict_knowledge_gap(cid, features)
    gap_prob = ml_res["knowledge_gap_probability"]
    assert gap_prob >= 0.5

    # Step 3: Deterministic Debt Confirmation
    debt = repository.detect_and_confirm_debt(sid, cid)
    assert debt is not None
    assert debt["status"] == DebtStatus.CONFIRMED_DEBT.value

    # Step 4: Root Cause Diagnosis Agent
    history = repository.get_evidence_history(sid, cid)
    prereqs = repository.get_concept_prerequisites(cid)
    diagnosis = diagnose_root_cause(sid, cid, history, prereqs)
    assert diagnosis.likely_root_cause is not None

    # Step 5: Adaptive LLM Intervention Strategy (V1)
    intervention_content = generate_intervention(debt["id"], cid, diagnosis.likely_root_cause, [])
    rec_int = repository.record_intervention(debt["id"], None, intervention_content)
    assert rec_int["version"] == "V1"

    # State transition cycle: CONFIRMED_DEBT -> INTERVENTION_PROPOSED -> MENTOR_REVIEW -> IN_INTERVENTION
    repository.update_debt_status(debt["id"], DebtStatus.INTERVENTION_PROPOSED)
    repository.update_debt_status(debt["id"], DebtStatus.MENTOR_REVIEW)
    repository.record_mentor_review(rec_int["id"], "approved")
    debt = repository.update_debt_status(debt["id"], DebtStatus.IN_INTERVENTION)
    assert debt["status"] == DebtStatus.IN_INTERVENTION.value

    # Step 6: Verification Challenge & Mastery Transition (REPAID)
    repository.update_debt_status(debt["id"], DebtStatus.FOLLOW_UP)
    repository.update_debt_status(debt["id"], DebtStatus.VERIFYING)
    passing_ev = repository.add_evidence(sid, cid, "quiz", score=100.0, passed=True)

    repaid_debt = repository.update_debt_status(debt["id"], DebtStatus.REPAID, evidence_id=passing_ev["id"])
    assert repaid_debt["status"] == DebtStatus.REPAID.value


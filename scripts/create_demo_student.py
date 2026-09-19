"""
Script: create_demo_student.py

Creates a repeatable, rich demo slice for presentation to judges/evaluators.
Invokes actual database repository logic to seed student assessment history,
ML feature extraction, confirmed debt lifecycle, root-cause diagnosis, and V1 intervention.
"""

import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import repository
from database.state_machine import DebtStatus
from database.models import Severity
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention


def create_demo_student():
    print("=" * 70)
    print(" KNOWLEDGE DEBT ENGINE — CREATING REPEATABLE DEMO STUDENT SLICE")
    print("=" * 70)

    # 1. Create or get Demo Student
    student = repository.get_student(external_id="demo_student")
    if not student:
        student = repository.create_student(
            external_id="demo_student",
            name="Arun Kumar (Demo)",
        )
    student_id = student["id"]
    print(f"[1/5] Demo Student Created/Loaded: ID={student_id}, Name='{student['name']}'")


    # 2. Get DSA Subject & Concepts
    dsa_subject = repository.get_subject_by_code("DSA")
    if not dsa_subject:
        print("[ERROR] DSA Subject not found. Please run seed importer first: python -m database.seed.import_dsa")
        return

    subject_id = dsa_subject["id"]
    concepts = repository.list_concepts_by_subject(subject_id)
    concept_map = {c["code"]: c for c in concepts}
    print(f"[2/5] DSA Subject Loaded: ID={subject_id}, Concepts Found={len(concepts)}")

    # Target concepts for demo slice: Pointers & Linked Lists
    ptr_concept = concept_map.get("DSA-PTR-001") or concepts[0]
    ll_concept = concept_map.get("DSA-LL-001") or concepts[1]

    # 3. Simulate Diagnostic Quiz Evidence
    print("[3/5] Recording Diagnostic Assessment Responses...")
    # Add failing evidence for Pointers (20% & 40%)
    repository.add_evidence(student_id, ptr_concept["id"], "quiz", score=20.0, passed=False)
    repository.add_evidence(student_id, ptr_concept["id"], "quiz", score=40.0, passed=False)

    # Add passing evidence for Arrays (85%)
    arr_concept = concept_map.get("DSA-ARR-001") or concepts[2]
    repository.add_evidence(student_id, arr_concept["id"], "quiz", score=85.0, passed=True)

    # 4. Extract ML Features & Predict Knowledge Gap
    print("[4/5] Running ML Feature Extractor & Knowledge Gap Inference...")
    features = extract_student_concept_features(student_id, ptr_concept["id"])
    ml_res = predict_knowledge_gap(ptr_concept["id"], features)
    gap_prob = ml_res["knowledge_gap_probability"]
    print(f"      Concept: '{ptr_concept['name']}' -> ML Knowledge Gap Probability: {gap_prob:.2%}")

    # 5. Execute Deterministic Debt Lifecycle & Remediation Generation
    print("[5/5] Executing State Machine Transitions & LLM Remediation...")
    debt = repository.get_or_create_debt(student_id, ptr_concept["id"])
    debt_id = debt["id"]

    if debt["status"] == DebtStatus.CLEAR.value:
        debt = repository.update_debt_status(debt_id, DebtStatus.SUSPECTED)
    if debt["status"] == DebtStatus.SUSPECTED.value:
        debt = repository.update_debt_status(debt_id, DebtStatus.CONFIRMED_DEBT)

    repository.update_debt_severity(debt_id, Severity.HIGH)

    # Root Cause Diagnosis
    history = repository.get_evidence_history(student_id, ptr_concept["id"])
    prereqs = repository.get_concept_prerequisites(ptr_concept["id"])
    diagnosis = diagnose_root_cause(student_id, ptr_concept["id"], history, prereqs)
    print(f"      Root-Cause Identified: Likely Root Concept ID={diagnosis.likely_root_cause}")

    # Intervention Generation
    intervention_content = generate_intervention(
        debt_id=debt_id,
        concept_id=ptr_concept["id"],
        root_cause_id=diagnosis.likely_root_cause,
        previous_versions=[]
    )
    intervention = repository.record_intervention(debt_id, None, intervention_content)

    repository.update_debt_status(debt_id, DebtStatus.INTERVENTION_PROPOSED)
    repository.update_debt_status(debt_id, DebtStatus.MENTOR_REVIEW)
    repository.record_mentor_review(intervention["id"], "approved")
    repository.update_debt_status(debt_id, DebtStatus.IN_INTERVENTION)


    print("=" * 70)
    print(" DEMO SLICE SUCCESSFULLY CREATED")
    print(f" Student ID: {student_id}")
    print(f" Confirmed Debt: {ptr_concept['name']} (ID={debt_id})")
    print(f" Status: IN_INTERVENTION")
    print(f" Strategy Version: V1")
    print("=" * 70)

if __name__ == "__main__":
    create_demo_student()

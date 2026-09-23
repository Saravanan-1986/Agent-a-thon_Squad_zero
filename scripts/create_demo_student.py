"""
Script: create_demo_student.py

Creates the canonical Hackathon Flagship Demo Student (Rahul Sharma)
illustrating the core thesis:
"LLM proposes. ML predicts. Deterministic code decides."

Student: Rahul Sharma
  1. Arrays (DSA-ARR-TRAVERSAL)       -> REPAID
  2. Pointers (DSA-PTR-DEREF)          -> ACTIVE DEBT (HIGH Severity, V1 generated)
  3. Linked Lists (DSA-LL-TRAVERSAL)  -> SUSPECTED (Single failure != debt)
  4. Trees (DSA-TREE-TRAVERSAL)        -> CLEAR
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import repository
from database.state_machine import DebtStatus
from database.models import Severity
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention


def create_demo_student():
    print("=" * 75)
    print(" KNOWLEDGE DEBT ENGINE — CREATING CANONICAL DEMO STUDENT (RAHUL SHARMA)")
    print("=" * 75)

    # 1. Create or get Demo Student (Ensure Student ID 1 and rahul_demo are both configured)
    student = repository.get_student(1)
    if not student:
        student = repository.get_student(external_id="rahul_demo") or repository.get_student(external_id="demo_student")
    if not student:
        student = repository.create_student(
            external_id="rahul_demo",
            name="Rahul Sharma",
        )
    student_id = student["id"]
    if student.get("name") != "Rahul Sharma":
        try:
            repository.update_student_leetcode_username(student_id, "Karuppasamy654")
        except Exception:
            pass
    print(f"[1/6] Demo Student Loaded: ID={student_id}, Name='{student['name']}', ExternalID='{student.get('external_id')}'")

    # 2. Get DSA Subject & Concepts
    dsa_subject = repository.get_subject_by_code("DSA")
    if not dsa_subject:
        print("[ERROR] DSA Subject not found. Please run seed importer first: python -m database.seed.import_dsa")
        return

    subject_id = dsa_subject["id"]
    concepts = repository.list_concepts_by_subject(subject_id)
    concept_map = {c["code"]: c for c in concepts}
    print(f"[2/6] DSA Subject Loaded: {len(concepts)} concepts verified in DAG.")

    arr_concept = concept_map.get("DSA-ARR-TRAVERSAL")
    ptr_concept = concept_map.get("DSA-PTR-DEREF") or concept_map.get("DSA-PTR-BASICS")
    ll_concept = concept_map.get("DSA-LL-TRAVERSAL")
    tree_concept = concept_map.get("DSA-TREE-TRAVERSAL")

    if not all([arr_concept, ptr_concept, ll_concept]):
        print("[ERROR] Required concepts missing from database. Please run import_dsa.")
        return

    # 3. Seed Arrays -> REPAID
    print(f"[3/6] Seeding Concept 1: '{arr_concept['name']}' -> REPAID state...")
    ev_arr1 = repository.add_evidence(student_id, arr_concept["id"], "quiz", score=85.0, passed=True)
    ev_arr2 = repository.add_evidence(student_id, arr_concept["id"], "coding", score=90.0, passed=True)
    arr_debt = repository.get_or_create_debt(student_id, arr_concept["id"])
    arr_did = arr_debt["id"]

    # Walk lifecycle to REPAID
    if arr_debt["status"] == DebtStatus.CLEAR.value:
        repository.update_debt_status(arr_did, DebtStatus.SUSPECTED)
        repository.update_debt_status(arr_did, DebtStatus.CONFIRMED_DEBT)
        repository.update_debt_status(arr_did, DebtStatus.INTERVENTION_PROPOSED)
        repository.update_debt_status(arr_did, DebtStatus.MENTOR_REVIEW)
        repository.update_debt_status(arr_did, DebtStatus.IN_INTERVENTION)
        repository.update_debt_status(arr_did, DebtStatus.FOLLOW_UP)
        repository.update_debt_status(arr_did, DebtStatus.VERIFYING)
        # Gated repayment with passing verification evidence
        ver_ev = repository.add_evidence(student_id, arr_concept["id"], "follow_up", score=95.0, passed=True)
        repository.update_debt_status(arr_did, DebtStatus.REPAID, evidence_id=ver_ev["id"])
    print(f"      Arrays status: REPAID (Verified by passing evidence score 95%)")

    # 4. Seed Pointers -> ACTIVE DEBT (CONFIRMED_DEBT -> IN_INTERVENTION)
    print(f"[4/6] Seeding Concept 2: '{ptr_concept['name']}' -> ACTIVE DEBT (HIGH Severity)...")
    # Persistent failures (evidence pattern)
    repository.add_evidence(student_id, ptr_concept["id"], "quiz", score=42.0, passed=False)
    repository.add_evidence(student_id, ptr_concept["id"], "coding", score=0.0, passed=False)
    repository.add_evidence(student_id, ptr_concept["id"], "follow_up", score=45.0, passed=False)

    features = extract_student_concept_features(student_id, ptr_concept["id"])
    ml_res = predict_knowledge_gap(ptr_concept["id"], features)
    gap_prob = ml_res["knowledge_gap_probability"]
    print(f"      ML Knowledge Gap Risk: {gap_prob:.2%} (HIGH RISK >= 65%)")

    ptr_debt = repository.get_or_create_debt(student_id, ptr_concept["id"])
    ptr_did = ptr_debt["id"]

    repository.update_debt_severity(ptr_did, Severity.HIGH)

    # Diagnosis Agent
    ptr_history = repository.get_evidence_history(student_id, ptr_concept["id"])
    ptr_prereqs = repository.get_concept_prerequisites(ptr_concept["id"])
    diagnosis = diagnose_root_cause(student_id, ptr_concept["id"], ptr_history, ptr_prereqs)
    print(f"      Root Cause Diagnosis: {diagnosis.explanation}")

    # Intervention Generation (Idempotent)
    existing_ivs = repository.get_interventions(ptr_did)
    if existing_ivs:
        rec_int = existing_ivs[0]
    else:
        intervention_content = generate_intervention(
            debt_id=ptr_did,
            concept_id=ptr_concept["id"],
            root_cause_id=diagnosis.likely_root_cause,
            previous_versions=[]
        )
        rec_int = repository.record_intervention(ptr_did, "V1", intervention_content)

    curr_debt = repository.get_debt(ptr_did)
    if curr_debt and curr_debt.get("status") != DebtStatus.IN_INTERVENTION.value:
        if curr_debt.get("status") in [DebtStatus.CLEAR.value, DebtStatus.SUSPECTED.value]:
            if curr_debt.get("status") == DebtStatus.CLEAR.value:
                curr_debt = repository.update_debt_status(ptr_did, DebtStatus.SUSPECTED)
            curr_debt = repository.update_debt_status(ptr_did, DebtStatus.CONFIRMED_DEBT)

        if curr_debt.get("status") == DebtStatus.CONFIRMED_DEBT.value:
            curr_debt = repository.update_debt_status(ptr_did, DebtStatus.INTERVENTION_PROPOSED)
            curr_debt = repository.update_debt_status(ptr_did, DebtStatus.MENTOR_REVIEW)
            repository.record_mentor_review(rec_int["id"], "approved")
            curr_debt = repository.update_debt_status(ptr_did, DebtStatus.IN_INTERVENTION)


    print(f"      Pointers status: IN_INTERVENTION (Strategy Version: V1, Approved by Mentor)")


    # 5. Seed Linked Lists -> SUSPECTED (Single error)
    print(f"[5/6] Seeding Concept 3: '{ll_concept['name']}' -> SUSPECTED...")
    repository.add_evidence(student_id, ll_concept["id"], "quiz", score=35.0, passed=False)
    ll_debt = repository.get_or_create_debt(student_id, ll_concept["id"])
    ll_did = ll_debt["id"]
    if ll_debt["status"] == DebtStatus.CLEAR.value:
        repository.update_debt_status(ll_did, DebtStatus.SUSPECTED)
    repository.update_debt_severity(ll_did, Severity.MEDIUM)
    print(f"      Linked Lists status: SUSPECTED (Single failure != confirmed debt)")

    # 6. Trees -> CLEAR (no debts)
    if tree_concept:
        tree_debt = repository.get_or_create_debt(student_id, tree_concept["id"])
        print(f"[6/6] Concept 4: '{tree_concept['name']}' -> CLEAR (No debt recorded)")

    print("=" * 75)
    print(" CANONICAL DEMO STUDENT PROFILE READY")
    print(f" Student ID:   {student_id} (Rahul Sharma)")
    print(f" Arrays:       [REPAID] (Mastered & Evidence Verified)")
    print(f" Pointers:     [ACTIVE DEBT] (HIGH Severity, V1 In Progress)")
    print(f" Linked Lists: [SUSPECTED] (Single Failure Under Monitoring)")
    print(f" Trees:        [CLEAR] (Healthy, No Debt)")
    print("=" * 75)


if __name__ == "__main__":
    create_demo_student()

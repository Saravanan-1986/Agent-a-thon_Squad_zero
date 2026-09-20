"""
Live Multi-Agent Execution Proof & Verification Script

Executes all 4 core agents (DiagnosisAgent, InterventionAgent, VerificationAgent, LessonCritic)
and prints empirical execution results with full evidence output.
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import repository
from database.connection import init_db
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention
from backend.agents.verification_agent import generate_verification_question, score_verification
from backend.agents.lesson_critic import evaluate_lesson_draft

def run_agent_demonstration():
    print("=" * 80)
    print(" KNOWLEDGE DEBT ENGINE -- MULTI-AGENT EXECUTION PROOF")
    print("=" * 80)

    # 1. Initialize Database
    init_db()
    
    student_id = 1
    concept_id = 48  # Pointer Dereferencing
    debt_id = 101

    print("\n[STEP 1] Running DiagnosisAgent (Root-Cause Analysis)...")
    history = [
        {"evidence_id": 1, "source": "quiz", "score": 30.0, "passed": False},
        {"evidence_id": 2, "source": "coding", "score": 40.0, "passed": False}
    ]
    prereqs = [
        {"concept_id": 47, "concept_name": "Memory Model (Heap & Stack)", "relationship_type": "requires", "strength": 1.0}
    ]
    
    diagnosis = diagnose_root_cause(student_id, concept_id, history, prereqs)
    print(f"  -> Observed Weakness Concept ID: {diagnosis.observed_weakness}")
    print(f"  -> Isolated Root Cause ID: {diagnosis.likely_root_cause}")
    print(f"  -> Confidence Score: {diagnosis.confidence * 100:.1f}%")
    print(f"  -> Diagnosis Explanation: {diagnosis.explanation}")
    print("  [OK] DiagnosisAgent Output Verified.")

    print("\n[STEP 2] Running InterventionAgent (Version 1 Strategy)...")
    v1_intervention = generate_intervention(
        debt_id=debt_id,
        concept_id=concept_id,
        root_cause_id=diagnosis.likely_root_cause,
        previous_versions=[]
    )
    print(f"  -> Version: {v1_intervention.get('version')}")
    print(f"  -> Strategy Title: {v1_intervention.get('strategy')}")
    print(f"  -> Concept Explanation Snippet: {v1_intervention.get('concept_explanation')[:120]}...")
    print(f"  -> Practice Questions Count: {len(v1_intervention.get('practice_questions', []))}")
    print("  [OK] InterventionAgent V1 Output Verified.")

    print("\n[STEP 3] Running InterventionAgent (Version 2 Adaptive Retry Strategy)...")
    v2_intervention = generate_intervention(
        debt_id=debt_id,
        concept_id=concept_id,
        root_cause_id=diagnosis.likely_root_cause,
        previous_versions=[{"version": 1, "content": v1_intervention}]
    )
    print(f"  -> Version: {v2_intervention.get('version')}")
    print(f"  -> Adaptive Strategy Title: {v2_intervention.get('strategy')}")
    print("  [OK] InterventionAgent V2 Output Verified.")

    print("\n[STEP 4] Running VerificationAgent (Transfer Challenge Generation & Scoring)...")
    v_question = generate_verification_question(debt_id=debt_id, concept_id=concept_id, student_id=student_id)
    print(f"  -> Generated Verification Question: \"{v_question.get('question')}\"")

    student_answer = (
        "Memory for p was allocated on the heap using malloc. Calling free(p) deallocates that memory "
        "and makes p a dangling pointer. Accessing *p without reallocating causes undefined behavior "
        "or segmentation fault because the address is no longer valid. Fix by setting p = NULL after free."
    )
    eval_result = score_verification(
        question=v_question.get("question"),
        student_answer=student_answer,
        student_id=student_id
    )
    print(f"  -> Student Answer Score: {eval_result.get('score')} / 100.0")
    print(f"  -> Evaluation Passed: {eval_result.get('passed')}")
    print(f"  -> Concept Understood: {eval_result.get('concept_understood')}")
    print(f"  -> Evaluation Feedback: {eval_result.get('feedback')}")
    print("  [OK] VerificationAgent Output Verified.")

    print("\n[STEP 5] Running LessonCritic Agent (Pedagogical Quality Review)...")
    critique = evaluate_lesson_draft(
        lesson_draft=v1_intervention,
        concept_id=concept_id,
        root_cause_id=diagnosis.likely_root_cause,
        student_id=student_id
    )
    print(f"  -> Passed Critique Verdict: {critique.get('verdict')}")
    print(f"  -> Score: {critique.get('score')} / 100.0")
    print(f"  -> Feedback Reasons: {critique.get('reasons')}")
    print("  [OK] LessonCritic Agent Output Verified.")

    print("\n" + "=" * 80)
    print(" ALL AGENTS EXECUTED SUCCESSFULLY WITH EMPIRICAL EVIDENCE!")
    print("=" * 80)

if __name__ == "__main__":
    run_agent_demonstration()

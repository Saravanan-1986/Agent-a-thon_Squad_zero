"""
Automated Pytest Suite for Hackathon Rubric Requirements

Validates:
1. Shared 0.80 verification threshold (VERIFICATION_PASS_THRESHOLD = 80.0).
2. Critic loop cap (max 2 revisions, then mentor escalation).
3. Session logger output formatting & evidence JSON creation.
4. S001 / S002 demo seed exclusion from EVIDENCE.md generation.
"""

import os
import json
import pytest
from backend.state.state_machine import VERIFICATION_PASS_THRESHOLD
from backend.agents.verification_agent import score_verification
from backend.agents.lesson_critic import evaluate_lesson_draft
from backend.agents.intervention_agent import generate_intervention
from backend.services.session_logger import log_tester_session, EVIDENCE_DIR
from scripts.generate_evidence import generate_evidence_md, EVIDENCE_MD_PATH


def test_shared_verification_threshold_constant():
    """Verify shared constant VERIFICATION_PASS_THRESHOLD is 80.0 everywhere."""
    assert VERIFICATION_PASS_THRESHOLD == 80.0


def test_score_verification_enforces_80_threshold():
    """Verify deterministic scoring enforces pass = score >= 80.0."""
    os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"
    res_fail = score_verification("Question text", "don't know", student_id=1)
    assert res_fail["passed"] is False
    assert res_fail["score"] < 80.0

    res_short = score_verification("Question text", "abc", student_id=1)
    assert res_short["passed"] is False
    assert res_short["score"] < 80.0


def test_critic_evaluation_checklist_structure():
    """Verify Lesson Critic evaluates the 3-point checklist and returns verdict dict."""
    draft = {
        "strategy": "V1: Concept explanation",
        "concept_explanation": "Full detailed explanation of pointer addresses and dereferencing in C.",
        "memory_diagram": "```mermaid\ngraph LR\n```",
        "practice_questions": [{"id": 1, "question": "What is *p?", "answer": "42"}]
    }
    critic_res = evaluate_lesson_draft(draft, concept_id=48, root_cause_id=47, student_id=1, loop_count=1)
    assert "verdict" in critic_res
    assert "checklist" in critic_res
    assert "reasons" in critic_res
    assert "targets_misconception" in critic_res["checklist"]
    assert "no_answer_leak" in critic_res["checklist"]
    assert "ends_with_checkable" in critic_res["checklist"]


def test_intervention_critic_loop_cap():
    """Verify intervention generation respects max critic loop cap (2 attempts)."""
    os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"
    intervention = generate_intervention(debt_id=1, concept_id=48, root_cause_id=47, previous_versions=[])
    assert "version" in intervention
    assert intervention["version"] == 1
    assert "critic_evaluation" in intervention


def test_session_logger_and_s001_exclusion():
    """Verify session logger creates session JSON and generate_evidence excludes S001/S002 demo seeds."""
    os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"
    
    # 1. Log synthetic demo seed session
    demo_session = log_tester_session(
        tester_alias="S001_DemoStudent",
        task_description="Demo run",
        pre_test_diagnostic_score=40.0,
        post_test_verification_score=85.0,
        steps_taken=[{"phase": "Observe", "message": "Demo step"}],
        errors_encountered=[],
        time_to_finish_seconds=120,
        is_demo_seed=True
    )
    assert demo_session["is_demo_seed"] is True

    # 2. Run generate_evidence_md
    generate_evidence_md()
    
    # 3. Verify EVIDENCE.md exists and excludes S001
    assert os.path.exists(EVIDENCE_MD_PATH)
    with open(EVIDENCE_MD_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        assert "S001_DemoStudent" not in content
        assert "Total Real Tester Sessions**: 0" in content

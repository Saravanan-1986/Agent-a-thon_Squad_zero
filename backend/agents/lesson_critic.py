"""
Lesson Critic Agent

Core Principle: "LLM proposes. Code & Critic decide."

Responsibilities:
1. Evaluates generated lesson drafts against an explicit 3-item checklist:
   - targets_misconception: Does it target the tagged misconception?
   - no_answer_leak: Does it refrain from revealing direct quiz answers?
   - ends_with_checkable: Does it end with an interactive, checkable exercise or code trace?
2. Returns structured verdict: {verdict: bool, reasons: list[str], checklist: dict, score: float}.
3. Emits thinking trace steps showing judge evaluations.
"""

import os
import logging
from typing import Any, Dict, List
from backend.services.multi_model_engine import engine
from backend.api.stream import emit_thinking_step

logger = logging.getLogger("backend.agents.lesson_critic")


def evaluate_lesson_draft(
    lesson_draft: Dict[str, Any],
    concept_id: int,
    root_cause_id: int,
    student_id: int = 1,
    loop_count: int = 1
) -> Dict[str, Any]:
    """
    Judges a lesson draft against an explicit checklist before presenting to the student.
    Returns {verdict: bool, reasons: List[str], checklist: Dict[str, bool], score: float}.
    """
    strategy = str(lesson_draft.get("strategy", ""))
    explanation = str(lesson_draft.get("concept_explanation", ""))
    diagram = str(lesson_draft.get("memory_diagram", ""))
    questions = lesson_draft.get("practice_questions", [])
    
    full_text = f"{strategy}\n{explanation}\n{diagram}\n{str(questions)}"

    emit_thinking_step(
        student_id=student_id,
        phase="Verify",
        agent="LessonCritic",
        message=f"Lesson Critic (Loop #{loop_count}) evaluating draft against 3-point pedagogical checklist.",
        metadata={"loop_count": loop_count, "concept_id": concept_id}
    )

    is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]
    is_real_mode = engine.is_configured() and not is_test_mode

    if is_real_mode:
        system_prompt = (
            "You are a Senior Computer Science Curriculum Critic.\n"
            "Evaluate a proposed remediation lesson draft against these 3 explicit criteria:\n"
            "1. targets_misconception: Does it directly address the student's core misconception?\n"
            "2. no_answer_leak: Does it refrain from giving away verbatim answers to assessment questions?\n"
            "3. ends_with_checkable: Does it include or end with an interactive, checkable code trace or practice exercise?\n\n"
            "Return strictly valid JSON with this schema:\n"
            "{\n"
            '  "targets_misconception": boolean,\n'
            '  "no_answer_leak": boolean,\n'
            '  "ends_with_checkable": boolean,\n'
            '  "verdict": boolean,\n'
            '  "reasons": ["list of specific feedback items"],\n'
            '  "score": number (0 to 100)\n'
            "}"
        )
        user_prompt = f"Concept ID: {concept_id}, Root Cause ID: {root_cause_id}\n\nLesson Draft:\n{full_text[:1500]}"

        parsed = engine.generate_json(system_prompt, user_prompt, max_tokens=450, temperature=0.1)
        if parsed and isinstance(parsed, dict) and "verdict" in parsed:
            t_misc = bool(parsed.get("targets_misconception", True))
            no_leak = bool(parsed.get("no_answer_leak", True))
            checkable = bool(parsed.get("ends_with_checkable", True))
            reasons = parsed.get("reasons", [])
            if not isinstance(reasons, list):
                reasons = [str(reasons)]
            
            # Deterministic code rule: verdict is True ONLY if all 3 checklist items pass and score >= 80.0
            score_val = float(parsed.get("score", 85.0))
            score_val = max(0.0, min(100.0, score_val))
            code_verdict = t_misc and no_leak and checkable and (score_val >= 80.0)

            if not code_verdict and not reasons:
                reasons = ["Draft failed one or more checklist items or fell below 80% threshold."]

            emit_thinking_step(
                student_id=student_id,
                phase="Verify",
                agent="LessonCritic",
                message=f"Critic Loop #{loop_count} Result: VERDICT={'PASS' if code_verdict else 'REJECT'} (Score {score_val}%). Reasons: {', '.join(reasons)}",
                metadata={"loop_count": loop_count, "verdict": code_verdict, "reasons": reasons, "score": score_val}
            )

            return {
                "verdict": code_verdict,
                "reasons": reasons,
                "checklist": {
                    "targets_misconception": t_misc,
                    "no_answer_leak": no_leak,
                    "ends_with_checkable": checkable
                },
                "score": score_val
            }

    # Deterministic Code Fallback Evaluator
    t_misc = len(explanation) > 20
    no_leak = "answer is" not in full_text.lower()
    checkable = len(questions) > 0 or "debug" in full_text.lower() or "trace" in full_text.lower()
    
    reasons = []
    if not t_misc:
        reasons.append("Explanation is too brief to address root cause misconception.")
    if not no_leak:
        reasons.append("Draft appears to reveal quiz answers.")
    if not checkable:
        reasons.append("Draft lacks interactive checkable exercises or trace walkthrough.")

    code_verdict = t_misc and no_leak and checkable
    score_val = 85.0 if code_verdict else 50.0

    emit_thinking_step(
        student_id=student_id,
        phase="Verify",
        agent="LessonCritic",
        message=f"Critic Loop #{loop_count} (Fallback): VERDICT={'PASS' if code_verdict else 'REJECT'}. Reasons: {', '.join(reasons) if reasons else 'Passes checklist'}",
        metadata={"loop_count": loop_count, "verdict": code_verdict, "reasons": reasons, "score": score_val}
    )

    return {
        "verdict": code_verdict,
        "reasons": reasons,
        "checklist": {
            "targets_misconception": t_misc,
            "no_answer_leak": no_leak,
            "ends_with_checkable": checkable
        },
        "score": score_val
    }

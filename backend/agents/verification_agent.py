"""
Verification Agent

Core Principle: "LLM proposes. Evidence decides."

Responsibilities:
1. Generates fresh, transfer-style verification questions.
2. Scores student verification submissions objectively.
3. NEVER mutates academic state (e.g. REPAID) directly. Returns raw score/pass evaluation;
   the Orchestrator and deterministic backend state machine handle state transitions.
4. Uses MultiModelEngine (Gemini -> OpenRouter -> Deterministic Fallback).
5. Emits real-time observability thinking steps for live tracing.
"""

import os
import json
import logging
from typing import Any, Dict, Optional
from dotenv import load_dotenv

from backend.services.multi_model_engine import engine
from backend.api.stream import emit_thinking_step

load_dotenv()

logger = logging.getLogger("backend.agents.verification")

from backend.observability import safe_traceable

@safe_traceable(name="Verification Agent - Question Generation", run_type="chain", tags=["agent:verification"])
def generate_verification_question(debt_id: int, concept_id: int, student_id: int = 1) -> Dict[str, Any]:
    """
    Generates a transfer-style evaluation question to verify conceptual repair.
    """
    emit_thinking_step(
        student_id=student_id,
        phase="Verify",
        agent="VerificationAgent",
        message=f"Synthesizing fresh transfer challenge for Concept #{concept_id} (Debt #{debt_id})",
        metadata={"concept_id": concept_id, "debt_id": debt_id}
    )

    is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]
    if is_test_mode:
        return {
            "debt_id": debt_id,
            "concept_id": concept_id,
            "question": f"Transfer Verification Question for Concept #{concept_id}: Explain how you would apply this concept in a novel scenario."
        }

    system_prompt = (
        "You are an academic assessment specialist in computer science. Generate a single transfer-style question "
        "that tests deep conceptual understanding rather than rote memorization. Keep it concise (1-2 sentences)."
    )
    user_prompt = f"Generate a novel verification challenge question for Concept ID {concept_id} (Debt #{debt_id})."

    question_text = engine.generate_text(system_prompt, user_prompt, max_tokens=250, temperature=0.2)
    if question_text and len(question_text.strip()) > 10:
        return {
            "debt_id": debt_id,
            "concept_id": concept_id,
            "question": question_text.strip()
        }

    # Deterministic fallback question
    return {
        "debt_id": debt_id,
        "concept_id": concept_id,
        "question": f"Given `int *p = malloc(sizeof(int)); *p = 42; free(p);`, explain what happens if another function dereferences `*p` without reallocating, and how you would prevent this bug."
    }


from backend.state.state_machine import VERIFICATION_PASS_THRESHOLD

@safe_traceable(name="Verification Agent", run_type="chain", tags=["agent:verification"])
def score_verification(question: str, student_answer: str, student_id: int = 1) -> Dict[str, Any]:
    """
    Evaluates student answer against the verification question.
    Returns score (0-100), passed (bool), concept_understood, reasoning, missing_elements, and feedback.

    STRICT SAFETY RULE:
    This function ONLY calculates the score and NEVER mutates database state directly.
    Deterministic Python backend enforces passed = score >= VERIFICATION_PASS_THRESHOLD (80.0%).
    LLM evaluates and returns structured feedback; deterministic threshold decides state repayment.
    """
    clean_answer = (student_answer or "").strip()
    student_lower = clean_answer.lower()

    # 1. Immediate rejection for empty or trivially short answers
    if not clean_answer or len(clean_answer) < 5:
        emit_thinking_step(
            student_id=student_id,
            phase="Verify",
            agent="VerificationAgent",
            message="Evaluated submission: empty or insufficient text. Score: 0.0% (FAIL).",
            metadata={"score": 0.0, "passed": False}
        )
        return {
            "passed": False,
            "score": 0.0,
            "concept_understood": False,
            "reasoning": "Answer was empty or insufficient to demonstrate mastery.",
            "evidence": [],
            "missing_elements": ["Full conceptual explanation"],
            "feedback": "Answer was empty or insufficient to demonstrate mastery."
        }

    # 2. Check for explicit non-answers / admissions of ignorance
    failing_signals = ["don't know", "idk", "not sure", "wrong", "bad answer", "just numbers", "help me", "no idea", "dunno", "fake answer"]
    if any(sig in student_lower for sig in failing_signals):
        emit_thinking_step(
            student_id=student_id,
            phase="Verify",
            agent="VerificationAgent",
            message="Evaluated submission: non-answer / failing signal detected. Score: 0.0% (FAIL).",
            metadata={"score": 0.0, "passed": False}
        )
        return {
            "passed": False,
            "score": 0.0,
            "concept_understood": False,
            "reasoning": "Submission explicitly stated lack of understanding or contained non-answers.",
            "evidence": [],
            "missing_elements": ["Demonstration of concept knowledge"],
            "feedback": "Submission contained non-answer signals and did not demonstrate conceptual mastery."
        }

    # 3. Check for prompt injection / self-report manipulation attempts
    injection_keywords = ["mark me as repaid", "set status to repaid", "force_repaid", "ignore previous instructions", "pass me"]
    if any(kw in student_lower for kw in injection_keywords):
        emit_thinking_step(
            student_id=student_id,
            phase="Verify",
            agent="VerificationAgent",
            message="Evaluated submission: prompt injection attempt detected. Score: 0.0% (FAIL).",
            metadata={"score": 0.0, "passed": False}
        )
        return {
            "passed": False,
            "score": 0.0,
            "concept_understood": False,
            "reasoning": "Adversarial prompt injection attempt detected.",
            "evidence": [],
            "missing_elements": ["Valid technical answer"],
            "feedback": "Adversarial attempt rejected. Verification requires genuine technical explanation."
        }

    is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]
    is_real_mode = engine.is_configured() and not is_test_mode

    # 4. LLM-Based Evaluation in Real Mode
    if is_real_mode:
        system_prompt = (
            "You are an academic grader evaluating student conceptual mastery in Computer Science.\n"
            "Assess whether the student's answer demonstrates deep understanding of the question topic.\n"
            "BE STRICT: Irrelevant text, keyword stuffing without logic, or gibberish MUST score low (<50.0).\n"
            f"A score >= {VERIFICATION_PASS_THRESHOLD} represents passing transfer mastery.\n"
            "Return strictly valid JSON with this schema:\n"
            "{\n"
            '  "score": number (0 to 100),\n'
            '  "concept_understood": boolean,\n'
            '  "reasoning": "detailed explanation of grade",\n'
            '  "missing_elements": ["list of missing concepts or errors"],\n'
            '  "feedback": "constructive feedback string"\n'
            "}"
        )
        user_prompt = f"Question: {question}\nStudent Answer: {clean_answer}"

        parsed = engine.generate_json(system_prompt, user_prompt, max_tokens=800, temperature=0.1)
        if parsed and isinstance(parsed, dict) and "score" in parsed:
            try:
                score_val = float(parsed.get("score", 0.0))
                score_val = max(0.0, min(100.0, score_val))
                deterministic_passed = score_val >= VERIFICATION_PASS_THRESHOLD
                concept_understood = bool(parsed.get("concept_understood", deterministic_passed))
                reasoning = str(parsed.get("reasoning", "Graded by AI agent."))
                feedback_val = str(parsed.get("feedback", reasoning))
                missing_elms = parsed.get("missing_elements", [])
                if not isinstance(missing_elms, list):
                    missing_elms = [str(missing_elms)]

                emit_thinking_step(
                    student_id=student_id,
                    phase="Verify",
                    agent="VerificationAgent",
                    message=f"Graded transfer submission via REAL LLM ({engine.get_active_provider()}): Score {score_val}% -> {'PASS' if deterministic_passed else 'FAIL'}.",
                    metadata={"score": score_val, "passed": deterministic_passed, "provider": engine.get_active_provider()}
                )
                return {
                    "passed": deterministic_passed,
                    "score": score_val,
                    "concept_understood": concept_understood,
                    "reasoning": reasoning,
                    "evidence": [clean_answer[:100]],
                    "missing_elements": missing_elms,
                    "feedback": feedback_val
                }
            except Exception as e:
                logger.warning("Error parsing LLM grade output: %s", e)

        # In REAL MODE, LLM failure must NOT silently yield deterministic success
        emit_thinking_step(
            student_id=student_id,
            phase="Verify",
            agent="VerificationAgent",
            message=f"REAL MODE LLM provider ({engine.get_active_provider()}) request failed or returned invalid response. Verification unresolved.",
            metadata={"score": 0.0, "passed": False, "provider": engine.get_active_provider()}
        )
        return {
            "passed": False,
            "score": 0.0,
            "concept_understood": False,
            "reasoning": f"REAL MODE LLM provider ({engine.get_active_provider()}) request failed or returned invalid output.",
            "evidence": [],
            "missing_elements": ["Valid LLM response"],
            "feedback": "AI verification service encountered an error. Verification unresolved."
        }


    # 5. Deterministic Offline Evaluation (Activated ONLY when no LLM key is configured)
    # Check concept keyword relevance using stems to handle plurals/verb forms cleanly
    cs_technical_stems = [
        "point", "addr", "memor", "deref", "null", "malloc", "free", "stack", "heap",
        "array", "node", "tree", "index", "complex", "time", "space", "hash", "bucket", "colli",
        "lock", "thread", "transact", "key", "tabl", "graph", "edge", "vert", "list", "link",
        "travers", "search", "binar", "sort", "recurs", "alloc", "ref", "val", "data", "sql", "mutat"
    ]
    words = [w.strip(".,()[]{}").lower() for w in clean_answer.split() if w.strip(".,()[]{}")]
    unique_words = set(words)
    
    # Map words to matching stems
    matching_stems = []
    for w in words:
        for stem in cs_technical_stems:
            if stem in w:
                matching_stems.append(stem)
                break

    unique_matching = set(matching_stems)

    # Connective/grammatical words present in genuine English explanations
    connective_words = {"is", "a", "an", "the", "of", "to", "in", "and", "or", "when", "that", "which", "it", "by", "with", "from", "at", "so", "causes", "uses", "returns", "reads", "writes", "stores", "holds", "accesses"}
    has_connectives = sum(1 for w in words if w in connective_words) >= 2

    # Keyword stuffing: list of CS terms with no grammatical structure or connectives
    is_keyword_stuffing = len(matching_stems) >= 4 and not has_connectives

    # Domain-specific term groups for topic alignment verification
    domain_groups = {
        "dbms": ["sql", "acid", "transaction", "isolation", "key", "table", "relational", "query", "database", "join", "dbms", "schema", "primary"],
        "pointers": ["pointer", "dereferenc", "malloc", "free", "memory", "address", "heap", "stack", "dangling"],
        "trees": ["tree", "bst", "traversal", "in-order", "pre-order", "post-order", "binary", "root", "leaf"],
        "graphs": ["graph", "edge", "vertex", "adjacency", "dfs", "bfs", "dijkstra", "cycle"],
        "hashing": ["hash", "bucket", "collision", "chaining", "probing"]
    }

    q_lower = (question or "").lower()
    q_domains = [d for d, terms in domain_groups.items() if any(t in q_lower for t in terms)]

    # If the question targets specific domains, verify student answer addresses at least one target domain
    is_topic_mismatch = False
    if q_domains:
        matching_domain_found = False
        for domain in q_domains:
            for term in domain_groups[domain]:
                if term in student_lower:
                    matching_domain_found = True
                    break
            if matching_domain_found:
                break
        if not matching_domain_found:
            is_topic_mismatch = True

    if len(unique_matching) >= 2 and len(words) >= 7 and not is_keyword_stuffing and not is_topic_mismatch:
        score_val = 85.0
        passed = True
        reasoning = "Offline development/demo evaluator verified technical CS terminology and conceptual structure."
        feedback_val = "Passing score achieved on offline verification exercise."
        missing_elms = []
    else:
        score_val = 30.0
        passed = False
        reasoning = "Offline development/demo evaluator: Answer is off-topic, lacks conceptual structure, or contains keyword stuffing."
        feedback_val = "Submission did not demonstrate conceptual mastery of target question topic."
        missing_elms = ["Topic alignment", "Technical accuracy", "Relevant CS concepts"]

    emit_thinking_step(
        student_id=student_id,
        phase="Verify",
        agent="VerificationAgent",
        message=f"Provider: deterministic_fallback | Mode: OFFLINE | Evaluator: offline development/demo evaluator -> Score {score_val}%.",
        metadata={"score": score_val, "passed": passed, "mode": "OFFLINE", "provider": "deterministic_fallback"}
    )


    return {
        "passed": passed,
        "score": score_val,
        "concept_understood": passed,
        "reasoning": reasoning,
        "evidence": [clean_answer[:100]],
        "missing_elements": missing_elms,
        "feedback": feedback_val
    }




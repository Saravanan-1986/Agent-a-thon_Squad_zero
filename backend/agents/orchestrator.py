"""
Orchestrator

Central workflow controller for the Knowledge Debt Engine.

Maintains strict separation:
- LLM outputs propose diagnosis, intervention content, questions, and scores.
- Backend state machine & evidence validation deterministically decide state transitions.
- Catches and handles InvalidStateTransitionError cleanly.
"""

import logging
import os
from typing import Any, Dict, List, Optional

from backend.state.states import DebtState
from backend.state.state_machine import validate_transition, InvalidStateTransitionError
from backend.agents.evidence_agent import evaluate_evidence
from backend.agents.diagnosis_agent import diagnose_root_cause
from backend.agents.intervention_agent import generate_intervention
from backend.agents.verification_agent import generate_verification_question, score_verification
from backend.api.stream import emit_thinking_step

logger = logging.getLogger(__name__)

# Repository interface bridge.
#   KNOWLEDGE_DEBT_USE_MOCK=true  -> deterministic in-memory store (backend/tests)
#   otherwise                     -> durable SQLAlchemy persistence via
#                                    database.compat (falls back to the mock
#                                    if the database layer is missing).
if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
    from backend.services.mock_repository import (
        add_evidence,
        get_evidence_history,
        get_or_create_debt,
        update_debt_status,
        record_intervention,
        record_mentor_review,
        log_event,
        get_debt_ledger,
        get_prerequisites
    )

    def record_verification_evidence(student_id, concept_id, score, passed, source="follow_up"):
        """In-memory mode does not persist verification outcomes as evidence;
        kept as a no-op so the orchestrator flow is identical in both modes."""
        return None
else:
    from database.compat import (
        add_evidence,
        get_evidence_history,
        get_or_create_debt,
        update_debt_status,
        record_intervention,
        record_mentor_review,
        log_event,
        get_debt_ledger,
        get_prerequisites,
        record_verification_evidence
    )


from database.state_machine import RETRY_LIMIT

class Orchestrator:
    def __init__(self, retry_limit: int = RETRY_LIMIT):
        self.retry_limit = retry_limit

    def process_new_evidence(self, student_id: int, concept_id: int, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes fresh student evidence, runs Evidence Agent, updates debt lifecycle if needed,
        and triggers Diagnosis and Intervention Agents.
        """
        # 1. Log incoming evidence
        evidence_record = add_evidence(
            student_id=student_id,
            concept_id=concept_id,
            source=evidence_data.get("source", "quiz"),
            score=float(evidence_data.get("score", 0.0)),
            passed=bool(evidence_data.get("passed", False))
        )
        log_event(student_id, "EVIDENCE_SUBMITTED", evidence_data)

        # 2. Check for regression on REPAID debt
        existing_debt = get_or_create_debt(student_id, concept_id)
        if existing_debt.get("status") == DebtState.REPAID.value:
            if not evidence_data.get("passed", True) or float(evidence_data.get("score", 100)) < 50.0:
                self.check_regression(
                    student_id, concept_id, evidence_data, existing_debt,
                    evidence_id=evidence_record["id"],
                )
                existing_debt = get_or_create_debt(student_id, concept_id)

        # 3. Pull history and evaluate evidence
        history = get_evidence_history(student_id, concept_id)
        assessment = evaluate_evidence(student_id, concept_id, history)

        debt_id = existing_debt["id"]
        current_status = existing_debt.get("status", DebtState.CLEAR.value)

        # 4. If Evidence Agent recommends CONFIRMED_DEBT
        if assessment.recommendation == DebtState.CONFIRMED_DEBT and current_status in [DebtState.CLEAR.value, DebtState.SUSPECTED.value]:
            try:
                # Transition CLEAR/SUSPECTED -> CONFIRMED_DEBT
                update_debt_status(debt_id, DebtState.CONFIRMED_DEBT.value)
                log_event(student_id, "DEBT_CONFIRMED", {"debt_id": debt_id, "reason": assessment.reason}, debt_id=debt_id)

                # 5. Run Diagnosis Agent
                prereqs = get_prerequisites(concept_id) if callable(get_prerequisites) else []
                diagnosis = diagnose_root_cause(student_id, concept_id, history, prereqs)
                log_event(student_id, "ROOT_CAUSE_DIAGNOSED", diagnosis.model_dump(), debt_id=debt_id)

                # 6. Run Intervention Agent
                intervention_content = generate_intervention(
                    debt_id=debt_id,
                    concept_id=concept_id,
                    root_cause_id=diagnosis.likely_root_cause,
                    previous_versions=[]
                )
                record_intervention(debt_id, 1, intervention_content)

                # Transition CONFIRMED_DEBT -> INTERVENTION_PROPOSED
                update_debt_status(debt_id, DebtState.INTERVENTION_PROPOSED.value)
                log_event(student_id, "INTERVENTION_PROPOSED", {"debt_id": debt_id, "version": 1}, debt_id=debt_id)

            except InvalidStateTransitionError as e:
                logger.error(f"State transition error during evidence processing: {e}")
                return {"status": "error", "message": str(e)}

        elif assessment.recommendation == DebtState.SUSPECTED and current_status == DebtState.CLEAR.value:
            try:
                update_debt_status(debt_id, DebtState.SUSPECTED.value)
                log_event(student_id, "DEBT_SUSPECTED", {"debt_id": debt_id, "reason": assessment.reason}, debt_id=debt_id)
            except InvalidStateTransitionError as e:
                logger.error(f"Failed to update to SUSPECTED: {e}")

        return {
            "evidence": evidence_record,
            "assessment": assessment.model_dump(),
            "debt": get_or_create_debt(student_id, concept_id)
        }

    def submit_mentor_review(self, intervention_id: int, debt_id: int, decision: str, edited_content: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Handles Mentor review decision (approve, edit, reject).
        """
        record_mentor_review(intervention_id, decision, edited_content)
        debt = get_or_create_debt(debt_id=debt_id)
        current_status = debt.get("status")

        if decision in ["approve", "edit"]:
            # Transition INTERVENTION_PROPOSED -> IN_INTERVENTION
            if current_status in [DebtState.INTERVENTION_PROPOSED.value, DebtState.MENTOR_REVIEW.value, DebtState.NEW_INTERVENTION.value]:
                update_debt_status(debt_id, DebtState.IN_INTERVENTION.value)
                log_event(debt["student_id"], "MENTOR_APPROVED_INTERVENTION", {"intervention_id": intervention_id, "decision": decision}, debt_id=debt_id)
        elif decision == "reject":
            # Rejection triggers new version generation
            log_event(debt["student_id"], "MENTOR_REJECTED_INTERVENTION", {"intervention_id": intervention_id}, debt_id=debt_id)
            self.handle_verification_failure(debt_id, is_mentor_rejection=True)

        return get_or_create_debt(debt_id=debt_id)

    def submit_verification_answer(self, debt_id: int, question: str, student_answer: str) -> Dict[str, Any]:
        """
        Evaluates student verification submission and deterministically updates state.
        Directly enforces: LLM proposes score, evidence decides state transition.
        """
        debt = get_or_create_debt(debt_id=debt_id)
        student_id = debt["student_id"]
        current_status = debt.get("status")

        # Must be in IN_INTERVENTION, FOLLOW_UP, or VERIFYING state
        if current_status not in [DebtState.IN_INTERVENTION.value, DebtState.FOLLOW_UP.value, DebtState.VERIFYING.value]:
            try:
                validate_transition(current_status, DebtState.VERIFYING.value)
            except InvalidStateTransitionError as e:
                return {"success": False, "message": f"Cannot submit verification answer: {e}"}

        # Set status to VERIFYING
        if current_status != DebtState.VERIFYING.value:
            update_debt_status(debt_id, DebtState.VERIFYING.value)

        # Agent scores the verification
        eval_result = score_verification(question, student_answer)
        passed = eval_result["passed"]

        if passed:
            # Deterministic backend state update to REPAID.
            # The verification outcome is persisted as REAL evidence first so
            # the repository's repayment gate has something to validate
            # ("LLM proposes. Evidence decides.").
            ver_evidence_id = record_verification_evidence(
                student_id, debt["concept_id"], eval_result["score"], True
            )
            update_debt_status(debt_id, DebtState.REPAID.value, evidence_id=ver_evidence_id)
            log_event(student_id, "DEBT_REPAID", {"debt_id": debt_id, "score": eval_result["score"]}, debt_id=debt_id)
            emit_thinking_step(
                student_id=student_id,
                phase="Adapt",
                agent="Orchestrator",
                message=f"Passing empirical verification validated (Score: {eval_result['score']}%). State machine retired Debt #{debt_id} to REPAID.",
                metadata={"debt_id": debt_id, "score": eval_result["score"], "status": "REPAID"}
            )
            new_status = DebtState.REPAID.value
        else:
            # Handle verification failure
            new_status = self.handle_verification_failure(debt_id)
            log_event(student_id, "VERIFICATION_FAILED", {"debt_id": debt_id, "score": eval_result["score"]}, debt_id=debt_id)
            emit_thinking_step(
                student_id=student_id,
                phase="Adapt",
                agent="Orchestrator",
                message=f"Verification failure (Score: {eval_result['score']}%). State machine triggered pedagogical adaptation flow (new status: {new_status}).",
                metadata={"debt_id": debt_id, "score": eval_result["score"], "status": new_status}
            )

        return {
            "passed": passed,
            "score": eval_result["score"],
            "feedback": eval_result["feedback"],
            "new_debt_status": new_status
        }

    def handle_verification_failure(self, debt_id: int, is_mentor_rejection: bool = False) -> str:
        """
        Handles verification or intervention rejection failures.
        Increments failed_interventions.
        If failed_interventions >= retry_limit (3) -> ESCALATED.
        Else -> Triggers Intervention Agent with previous failure reasoning -> NEW_INTERVENTION.
        """
        debt = get_or_create_debt(debt_id=debt_id)
        student_id = debt["student_id"]
        failed_count = debt.get("failed_interventions", 0) + 1
        debt["failed_interventions"] = failed_count

        if current_status := debt.get("status"):
            if current_status != DebtState.FAILED.value:
                try:
                    update_debt_status(debt_id, DebtState.FAILED.value)
                except InvalidStateTransitionError:
                    pass

        if failed_count >= self.retry_limit:
            # Transition FAILED -> ESCALATED
            update_debt_status(debt_id, DebtState.ESCALATED.value)
            log_event(student_id, "DEBT_ESCALATED", {"debt_id": debt_id, "attempts": failed_count}, debt_id=debt_id)
            return DebtState.ESCALATED.value
        else:
            # Generate new intervention strategy incorporating failure context
            prev_versions = debt.get("interventions", [])
            new_content = generate_intervention(
                debt_id=debt_id,
                concept_id=debt["concept_id"],
                root_cause_id=debt.get("root_cause_concept_id", debt["concept_id"]),
                previous_versions=prev_versions
            )
            record_intervention(debt_id, failed_count + 1, new_content)
            
            # Transition FAILED -> NEW_INTERVENTION
            update_debt_status(debt_id, DebtState.NEW_INTERVENTION.value)
            log_event(student_id, "NEW_INTERVENTION_GENERATED", {"debt_id": debt_id, "version": failed_count + 1}, debt_id=debt_id)
            return DebtState.NEW_INTERVENTION.value

    def check_regression(
        self,
        student_id: int,
        concept_id: int,
        new_evidence: Dict[str, Any],
        debt: Dict[str, Any],
        evidence_id: Optional[int] = None,
    ) -> None:
        """
        Handles regression loop: REPAID -> REGRESSED -> CONFIRMED_DEBT.
        The failing evidence that triggered the regression is attached so the
        repository's regression gate can validate it.
        """
        debt_id = debt["id"]
        logger.info(f"Regression detected for student {student_id}, concept {concept_id}. Transitioning REPAID -> REGRESSED.")
        update_debt_status(debt_id, DebtState.REGRESSED.value, evidence_id=evidence_id)
        log_event(student_id, "DEBT_REGRESSED", {"debt_id": debt_id, "evidence": new_evidence}, debt_id=debt_id)
        update_debt_status(debt_id, DebtState.CONFIRMED_DEBT.value)
        log_event(student_id, "DEBT_REOPENED", {"debt_id": debt_id}, debt_id=debt_id)

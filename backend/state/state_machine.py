"""
Deterministic State Machine Guard for Knowledge Debt Lifecycle.

Core Rule:
"LLM proposes. Evidence decides."
No agent or client request can skip states or directly force state transitions to REPAID
without passing deterministic backend verification.
"""

from backend.state.states import DebtState

# Shared deterministic verification threshold (0.80 / 80%)
VERIFICATION_PASS_THRESHOLD = 80.0

class InvalidStateTransitionError(Exception):
    """Raised when an illegal or out-of-order state transition is attempted."""
    pass

# Deterministic allowed transitions map
ALLOWED_TRANSITIONS = {
    DebtState.CLEAR: [DebtState.SUSPECTED, DebtState.CONFIRMED_DEBT],
    DebtState.SUSPECTED: [DebtState.CLEAR, DebtState.CONFIRMED_DEBT],
    DebtState.CONFIRMED_DEBT: [DebtState.INTERVENTION_PROPOSED],
    DebtState.INTERVENTION_PROPOSED: [DebtState.MENTOR_REVIEW, DebtState.IN_INTERVENTION, DebtState.NEW_INTERVENTION],
    DebtState.MENTOR_REVIEW: [DebtState.IN_INTERVENTION, DebtState.NEW_INTERVENTION],
    DebtState.IN_INTERVENTION: [DebtState.FOLLOW_UP, DebtState.VERIFYING],
    DebtState.FOLLOW_UP: [DebtState.VERIFYING],
    DebtState.VERIFYING: [DebtState.REPAID, DebtState.FAILED],
    DebtState.FAILED: [DebtState.NEW_INTERVENTION, DebtState.ESCALATED],
    DebtState.NEW_INTERVENTION: [DebtState.INTERVENTION_PROPOSED, DebtState.IN_INTERVENTION],
    DebtState.ESCALATED: [],  # Human intervention required
    DebtState.REPAID: [DebtState.REGRESSED],
    DebtState.REGRESSED: [DebtState.CONFIRMED_DEBT, DebtState.SUSPECTED],
}

def validate_transition(current_state: str, target_state: str) -> bool:
    """
    Validates if transitioning from current_state to target_state is legal.
    Raises InvalidStateTransitionError if illegal.
    """
    try:
        curr_enum = DebtState(current_state)
        target_enum = DebtState(target_state)
    except ValueError as e:
        raise InvalidStateTransitionError(f"Invalid state name: {e}")

    allowed = ALLOWED_TRANSITIONS.get(curr_enum, [])
    if target_enum not in allowed:
        raise InvalidStateTransitionError(
            f"Illegal state transition from {current_state} -> {target_state}. "
            f"Allowed transitions from {current_state}: {[s.value for s in allowed]}"
        )
    return True

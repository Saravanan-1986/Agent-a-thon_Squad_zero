"""
The debt lifecycle state machine — the ONLY place that knows which status
transitions are legal.

The repository calls validate_transition() inside update_debt_status(), so an
LLM, an agent, or a student cannot force an illegal academic state:

    CLEAR → SUSPECTED → CONFIRMED_DEBT → INTERVENTION_PROPOSED → MENTOR_REVIEW
          → IN_INTERVENTION → FOLLOW_UP → VERIFYING → REPAID

    VERIFYING → FAILED → (INTERVENTION_PROPOSED  [new strategy, version Vn+1]
                          | ESCALATED            [retry limit reached])

    REPAID → REGRESSED → CONFIRMED_DEBT   (a repaid concept degraded again)

Any transition not listed raises InvalidStateTransitionError. Evidence gates
(REPAID needs fresh passing evidence, REGRESSED needs failing evidence) live
in the repository — this module only owns the pure topology.
"""

from __future__ import annotations

from database.models import DebtStatus

#: Failed interventions after which a debt must ESCALATE instead of looping.
RETRY_LIMIT = 3


class KnowledgeDebtError(ValueError):
    """Base class for every Knowledge Debt Engine rule violation."""


class DebtNotFoundError(KnowledgeDebtError):
    """Raised when a referenced debt id does not exist."""


class InvalidStateTransitionError(KnowledgeDebtError):
    """Raised when a status change is not part of the legal lifecycle."""


class DebtVerificationError(KnowledgeDebtError):
    """Raised when mastery (or regression) is claimed without valid evidence.

    This is the 'student says: mark me REPAID' protection — repayment can only
    happen on fresh, passing verification evidence.
    """


class RetryLimitExceededError(KnowledgeDebtError):
    """Raised when a new intervention is attempted after the retry limit."""


#: The full legal lifecycle as a dict of current → allowed targets.
VALID_TRANSITIONS = {
    DebtStatus.CLEAR: {DebtStatus.SUSPECTED},
    DebtStatus.SUSPECTED: {DebtStatus.CONFIRMED_DEBT},
    DebtStatus.CONFIRMED_DEBT: {DebtStatus.INTERVENTION_PROPOSED},
    DebtStatus.INTERVENTION_PROPOSED: {DebtStatus.MENTOR_REVIEW},
    DebtStatus.MENTOR_REVIEW: {DebtStatus.IN_INTERVENTION},
    DebtStatus.IN_INTERVENTION: {DebtStatus.FOLLOW_UP},
    DebtStatus.FOLLOW_UP: {DebtStatus.VERIFYING},
    # REPAID is additionally gated on fresh passing verification evidence
    # (enforced in repository.update_debt_status).
    DebtStatus.VERIFYING: {DebtStatus.REPAID, DebtStatus.FAILED},
    # FAILED → INTERVENTION_PROPOSED is only legal while under RETRY_LIMIT,
    # FAILED → ESCALATED only at/above it (also repository-enforced).
    DebtStatus.FAILED: {DebtStatus.INTERVENTION_PROPOSED, DebtStatus.ESCALATED},
    # REGRESSED is gated on failing evidence (repository-enforced).
    DebtStatus.REPAID: {DebtStatus.REGRESSED},
    DebtStatus.REGRESSED: {DebtStatus.CONFIRMED_DEBT},
    # Terminal: leaving ESCALATED requires human/mentor action outside the
    # state machine (e.g. re-opening the debt as a new audit-tracked event).
    DebtStatus.ESCALATED: set(),
}


def normalize_status(value) -> DebtStatus:
    """Accept 'REPAID' or DebtStatus.REPAID; reject anything else loudly."""
    if isinstance(value, DebtStatus):
        return value
    try:
        return DebtStatus(str(value))
    except ValueError:
        raise InvalidStateTransitionError(f"Unknown debt status: {value!r}") from None


def is_valid_transition(current, new) -> bool:
    """True iff current → new is part of the legal lifecycle."""
    current = normalize_status(current)
    new = normalize_status(new)
    return new in VALID_TRANSITIONS.get(current, set())


def validate_transition(current, new) -> None:
    """Raise InvalidStateTransitionError unless current → new is legal."""
    current = normalize_status(current)
    new = normalize_status(new)
    allowed = VALID_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise InvalidStateTransitionError(
            f"Invalid state transition: {current.value} → {new.value}. "
            f"Allowed from {current.value}: "
            f"{sorted(s.value for s in allowed) or 'nothing (terminal state)'}"
        )

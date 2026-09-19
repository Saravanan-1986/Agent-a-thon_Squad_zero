import pytest
from backend.state.state_machine import validate_transition, InvalidStateTransitionError
from backend.state.states import DebtState

def test_valid_transitions():
    assert validate_transition(DebtState.CLEAR.value, DebtState.SUSPECTED.value) is True
    assert validate_transition(DebtState.SUSPECTED.value, DebtState.CONFIRMED_DEBT.value) is True
    assert validate_transition(DebtState.CONFIRMED_DEBT.value, DebtState.INTERVENTION_PROPOSED.value) is True
    assert validate_transition(DebtState.INTERVENTION_PROPOSED.value, DebtState.IN_INTERVENTION.value) is True
    assert validate_transition(DebtState.VERIFYING.value, DebtState.REPAID.value) is True
    assert validate_transition(DebtState.REPAID.value, DebtState.REGRESSED.value) is True

def test_invalid_direct_repaid_skip():
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(DebtState.CLEAR.value, DebtState.REPAID.value)

    with pytest.raises(InvalidStateTransitionError):
        validate_transition(DebtState.SUSPECTED.value, DebtState.REPAID.value)

    with pytest.raises(InvalidStateTransitionError):
        validate_transition(DebtState.INTERVENTION_PROPOSED.value, DebtState.REPAID.value)

def test_invalid_state_name():
    with pytest.raises(InvalidStateTransitionError):
        validate_transition("NON_EXISTENT_STATE", DebtState.REPAID.value)

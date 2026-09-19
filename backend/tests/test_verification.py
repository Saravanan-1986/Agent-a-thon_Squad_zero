import pytest
from backend.services.mock_repository import reset_repository, get_or_create_debt
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_verification_pass_repays_debt():
    orchestrator = Orchestrator()
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.IN_INTERVENTION.value

    res = orchestrator.submit_verification_answer(
        debt_id=debt["id"],
        question="Explain how pointer dereferencing works in indirect assignment.",
        student_answer="A pointer stores the memory address of another variable. Dereferencing with * accesses and modifies the underlying memory value directly."
    )
    assert res["passed"] is True
    assert res["new_debt_status"] == DebtState.REPAID.value
    assert debt["status"] == DebtState.REPAID.value

def test_verification_fail_triggers_failure_flow():
    orchestrator = Orchestrator()
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.IN_INTERVENTION.value

    res = orchestrator.submit_verification_answer(
        debt_id=debt["id"],
        question="Explain pointer dereferencing.",
        student_answer="Idk"
    )
    assert res["passed"] is False
    assert res["new_debt_status"] == DebtState.NEW_INTERVENTION.value
    assert debt["failed_interventions"] == 1

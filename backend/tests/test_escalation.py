import pytest
from backend.services.mock_repository import reset_repository, get_or_create_debt
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_escalation_after_repeated_failures():
    orchestrator = Orchestrator(retry_limit=3)
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt_id = debt["id"]
    debt["status"] = DebtState.IN_INTERVENTION.value

    # Fail 1
    orchestrator.submit_verification_answer(debt_id, "Q1", "bad answer 1")
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["failed_interventions"] == 1
    assert debt["status"] == DebtState.NEW_INTERVENTION.value

    # Approve V2 -> IN_INTERVENTION
    orchestrator.submit_mentor_review(intervention_id=debt["interventions"][-1]["id"], debt_id=debt_id, decision="approve")

    # Fail 2
    orchestrator.submit_verification_answer(debt_id, "Q2", "bad answer 2")
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["failed_interventions"] == 2
    assert debt["status"] == DebtState.NEW_INTERVENTION.value

    # Approve V3 -> IN_INTERVENTION
    orchestrator.submit_mentor_review(intervention_id=debt["interventions"][-1]["id"], debt_id=debt_id, decision="approve")

    # Fail 3 (reaches retry threshold = 3) -> ESCALATED
    res3 = orchestrator.submit_verification_answer(debt_id, "Q3", "bad answer 3")
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["failed_interventions"] == 3
    assert debt["status"] == DebtState.ESCALATED.value
    assert res3["new_debt_status"] == DebtState.ESCALATED.value

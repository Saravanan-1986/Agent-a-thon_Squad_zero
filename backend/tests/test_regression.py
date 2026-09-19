import pytest
from backend.services.mock_repository import reset_repository, get_or_create_debt, get_events_for_debt
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_regression_on_repaid_debt():
    orchestrator = Orchestrator()
    student_id = 1
    concept_id = 301

    debt = get_or_create_debt(student_id=student_id, concept_id=concept_id)
    debt["status"] = DebtState.REPAID.value

    # Repaid concept receives new weak evidence (score < 50%, passed = False)
    res = orchestrator.process_new_evidence(student_id, concept_id, {"source": "exam", "score": 30.0, "passed": False})
    
    updated_debt = get_or_create_debt(student_id=student_id, concept_id=concept_id)
    assert updated_debt["status"] in [DebtState.CONFIRMED_DEBT.value, DebtState.INTERVENTION_PROPOSED.value]

    events = get_events_for_debt(updated_debt["id"])
    event_types = [e["event_type"] for e in events]
    assert "DEBT_REGRESSED" in event_types, "Event audit trail MUST record DEBT_REGRESSED event."
    assert "DEBT_REOPENED" in event_types, "Event audit trail MUST record DEBT_REOPENED event."

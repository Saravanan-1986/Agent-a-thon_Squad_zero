import pytest
from backend.services.mock_repository import reset_repository, get_or_create_debt, record_intervention
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_mentor_approval():
    orchestrator = Orchestrator()
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.INTERVENTION_PROPOSED.value
    inter = record_intervention(debt["id"], 1, {"strategy": "V1", "concept_explanation": "V1 Text"})

    res = orchestrator.submit_mentor_review(intervention_id=inter["id"], debt_id=debt["id"], decision="approve")
    assert res["status"] == DebtState.IN_INTERVENTION.value

def test_mentor_edit_updates_active_content():
    orchestrator = Orchestrator()
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.INTERVENTION_PROPOSED.value
    inter = record_intervention(debt["id"], 1, {"strategy": "V1", "concept_explanation": "Original Text"})

    edited_payload = {"strategy": "V1-Edited", "concept_explanation": "Mentor Clarified Explanation"}
    res = orchestrator.submit_mentor_review(intervention_id=inter["id"], debt_id=debt["id"], decision="edit", edited_content=edited_payload)
    assert res["status"] == DebtState.IN_INTERVENTION.value
    assert inter["content"]["concept_explanation"] == "Mentor Clarified Explanation"

def test_mentor_reject_triggers_new_intervention():
    orchestrator = Orchestrator()
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.INTERVENTION_PROPOSED.value
    inter = record_intervention(debt["id"], 1, {"strategy": "V1", "concept_explanation": "Original Text"})

    res = orchestrator.submit_mentor_review(intervention_id=inter["id"], debt_id=debt["id"], decision="reject")
    assert res["status"] in [DebtState.NEW_INTERVENTION.value, DebtState.FAILED.value]
    assert len(debt["interventions"]) == 2, "Rejection MUST trigger new intervention strategy generation."

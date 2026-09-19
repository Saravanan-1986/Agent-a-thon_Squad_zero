import pytest
from backend.services.mock_repository import reset_repository
from backend.agents.evidence_agent import evaluate_evidence
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_single_failure_triggers_suspected():
    orchestrator = Orchestrator()
    res = orchestrator.process_new_evidence(student_id=1, concept_id=101, evidence_data={"source": "quiz", "score": 40.0, "passed": False})
    debt = res["debt"]
    assert debt["status"] == DebtState.SUSPECTED.value, "Single bad attempt MUST result in SUSPECTED state, not CONFIRMED_DEBT."

def test_repeated_failure_triggers_confirmed_debt():
    orchestrator = Orchestrator()
    orchestrator.process_new_evidence(student_id=1, concept_id=101, evidence_data={"source": "quiz", "score": 40.0, "passed": False})
    res2 = orchestrator.process_new_evidence(student_id=1, concept_id=101, evidence_data={"source": "coding", "score": 35.0, "passed": False})
    debt = res2["debt"]
    assert debt["status"] == DebtState.INTERVENTION_PROPOSED.value, "Two bad attempts MUST confirm debt and propose intervention."

def test_passing_evidence_remains_clear():
    orchestrator = Orchestrator()
    res = orchestrator.process_new_evidence(student_id=1, concept_id=102, evidence_data={"source": "quiz", "score": 90.0, "passed": True})
    debt = res["debt"]
    assert debt["status"] == DebtState.CLEAR.value, "Passing evidence MUST keep status CLEAR."

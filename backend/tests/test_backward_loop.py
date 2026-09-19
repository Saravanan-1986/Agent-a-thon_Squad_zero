import pytest
from backend.services.mock_repository import reset_repository, get_or_create_debt, get_events_for_debt
from backend.agents.orchestrator import Orchestrator
from backend.state.states import DebtState

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_complete_backward_loop():
    orchestrator = Orchestrator()
    student_id = 1
    concept_id = 201

    # 1. Evidence 1: Fail -> SUSPECTED
    res1 = orchestrator.process_new_evidence(student_id, concept_id, {"source": "quiz", "score": 40.0, "passed": False})
    debt_id = res1["debt"]["id"]
    assert res1["debt"]["status"] == DebtState.SUSPECTED.value

    # 2. Evidence 2: Fail -> CONFIRMED_DEBT -> INTERVENTION_PROPOSED V1
    res2 = orchestrator.process_new_evidence(student_id, concept_id, {"source": "coding", "score": 30.0, "passed": False})
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["status"] == DebtState.INTERVENTION_PROPOSED.value
    assert len(debt["interventions"]) == 1
    v1_strategy = debt["interventions"][0]["content"]["strategy"]

    # 3. Mentor Review: Approve V1 -> IN_INTERVENTION
    inter_v1_id = debt["interventions"][0]["id"]
    orchestrator.submit_mentor_review(intervention_id=inter_v1_id, debt_id=debt_id, decision="approve")
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["status"] == DebtState.IN_INTERVENTION.value

    # 4. Verification V1: FAIL -> NEW_INTERVENTION V2
    ver_v1_res = orchestrator.submit_verification_answer(debt_id, "Explain pointers in C.", "Pointers are just numbers.")
    assert ver_v1_res["passed"] is False
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["status"] == DebtState.NEW_INTERVENTION.value
    assert len(debt["interventions"]) == 2

    v2_strategy = debt["interventions"][1]["content"]["strategy"]
    assert v2_strategy != v1_strategy, "V2 strategy MUST be different from V1 strategy after failure."

    # 5. Mentor Review V2: Approve V2 -> IN_INTERVENTION
    inter_v2_id = debt["interventions"][1]["id"]
    orchestrator.submit_mentor_review(intervention_id=inter_v2_id, debt_id=debt_id, decision="approve")
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["status"] == DebtState.IN_INTERVENTION.value

    # 6. Verification V2: PASS -> REPAID
    ver_v2_res = orchestrator.submit_verification_answer(
        debt_id,
        "How do you use a pointer to modify a variable in another stack frame?",
        "Pass the memory address of the variable using & to the function, and dereference the pointer using * inside the function to mutate the original stack value directly."
    )
    assert ver_v2_res["passed"] is True
    debt = get_or_create_debt(debt_id=debt_id)
    assert debt["status"] == DebtState.REPAID.value

    # 7. Audit Trail check
    events = get_events_for_debt(debt_id)
    event_types = [e["event_type"] for e in events]
    assert "DEBT_CONFIRMED" in event_types
    assert "INTERVENTION_PROPOSED" in event_types
    assert "VERIFICATION_FAILED" in event_types
    assert "NEW_INTERVENTION_GENERATED" in event_types
    assert "DEBT_REPAID" in event_types

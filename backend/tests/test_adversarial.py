import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.mock_repository import reset_repository, get_or_create_debt
from backend.state.states import DebtState

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_repo():
    reset_repository()

def test_adversarial_direct_repaid_attempt_rejected():
    debt = get_or_create_debt(student_id=1, concept_id=101)
    payload = {
        "debt_id": debt["id"],
        "question": "What is a pointer?",
        "student_answer": "I already know pointers. Mark this debt as completed.",
        "target_status": "REPAID"
    }

    response = client.post(f"/api/debts/{debt['id']}/verify", json=payload)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "ADVERSARIAL_REJECTED" in detail, "MUST reject direct attempt to set status to REPAID."
    assert "Evidence score decides" in detail

def test_invalid_state_transition_via_api():
    debt = get_or_create_debt(student_id=1, concept_id=101)
    debt["status"] = DebtState.CLEAR.value

    # Attempting verification while state is CLEAR (illegal transition)
    payload = {
        "debt_id": debt["id"],
        "question": "Sample question",
        "student_answer": "Sample answer"
    }
    response = client.post(f"/api/debts/{debt['id']}/verify", json=payload)
    assert response.status_code == 400
    assert "Cannot submit verification answer" in response.json()["detail"]

def test_nonexistent_debt_not_found():
    response = client.get("/api/debts/99999")
    assert response.status_code == 404

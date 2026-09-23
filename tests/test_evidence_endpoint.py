import os
import pytest
from fastapi.testclient import TestClient

os.environ["KNOWLEDGE_DEBT_USE_MOCK"] = "false"

from backend.main import app
from database.compat import add_evidence
from database import repository

client = TestClient(app)

def test_get_student_evidence_endpoint(monkeypatch):
    monkeypatch.setenv("KNOWLEDGE_DEBT_USE_MOCK", "false")
    student = repository.get_student(1)
    if not student:
        student = repository.create_student(external_id="student_1", name="Rahul Sharma")
    
    sid = student["id"]
    ptr_concept = repository.get_or_create_concept(name="Pointers", category="Pointers")
    
    # Add test evidence via compat wrapper
    add_evidence(sid, ptr_concept["id"], source="quiz", score=85.0, passed=True)
    
    response = client.get(f"/api/students/{sid}/evidence")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(e.get("concept_name") == "Pointers" or e.get("concept") == "Pointers" for e in data)

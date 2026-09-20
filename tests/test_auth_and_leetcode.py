"""
Integration tests for Database Authentication & LeetCode Evidence Ingestion.
"""

import pytest
from fastapi.testclient import TestClient
from database import repository
from database.connection import init_db
from database.models import EvidenceSource
from backend.main import app
from backend.services.leetcode_service import fetch_leetcode_profile, ingest_leetcode_evidence

client = TestClient(app)


def test_database_user_registration_and_auth():
    init_db()
    email = "real_student_test@example.com"
    pwd = "secretpassword123"

    # Register user
    user = repository.create_user_account(
        name="Test Real Student",
        email=email,
        password=pwd,
        leetcode_username="tourist",
    )

    assert user["id"] is not None
    assert user["email"] == email
    assert user["leetcode_username"] == "tourist"

    # Authenticate user
    auth_user = repository.authenticate_user_account(email, pwd)
    assert auth_user is not None
    assert auth_user["id"] == user["id"]

    # Invalid password
    fail_auth = repository.authenticate_user_account(email, "wrongpassword")
    assert fail_auth is None


def test_auth_rest_api_endpoints():
    init_db()
    repository.create_subject(code="DSA", title="Data Structures")
    repository.get_or_create_concept(name="Array Traversal", category="Arrays", difficulty_baseline=0.3)
    email = "api_test_user@example.com"
    pwd = "myapipassword"

    # 1. Register endpoint
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "API Test User",
            "email": email,
            "password": pwd,
            "leetcode_username": "neal_wu",
        },
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["message"] == "User registered successfully"
    student_id = data["user"]["id"]

    # 2. Login endpoint
    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": pwd},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["user"]["id"] == student_id

    # 3. Sync LeetCode endpoint
    sync_resp = client.post(
        f"/api/auth/sync-leetcode/{student_id}",
        json={"leetcode_username": "neal_wu"},
    )
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["message"] == "LeetCode evidence synced successfully"
    assert sync_data["sync_details"]["evidence_count"] > 0


def test_leetcode_profile_fetch():
    profile = fetch_leetcode_profile("tourist")
    assert profile["username"] == "tourist"
    assert "totalSolved" in profile

"""
Authentication & LeetCode Integration API Router.

Provides database-backed student registration, password authentication,
and real-time LeetCode evidence sync.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status

from database import repository
from database.state_machine import KnowledgeDebtError
from backend.schemas.student import UserRegister, UserLogin, LeetCodeSyncRequest, StudentOut
from backend.services.leetcode_service import fetch_leetcode_profile, ingest_leetcode_evidence

router = APIRouter(prefix="/auth", tags=["Auth & LeetCode"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister) -> Dict[str, Any]:
    """Register a new student account in the database."""
    if not payload.email or "@" not in payload.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email address is required.",
        )
    if not payload.password or len(payload.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    try:
        user = repository.create_user_account(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            leetcode_username=payload.leetcode_username,
        )
    except KnowledgeDebtError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # If LeetCode username was provided, attempt initial sync immediately
    leetcode_result = None
    if payload.leetcode_username and payload.leetcode_username.strip():
        leetcode_result = ingest_leetcode_evidence(user["id"], payload.leetcode_username.strip())

    return {
        "message": "User registered successfully",
        "user": user,
        "leetcode_sync": leetcode_result,
    }


@router.post("/login")
def login(payload: UserLogin) -> Dict[str, Any]:
    """Authenticate user with database credentials."""
    user = repository.authenticate_user_account(email=payload.email, password=payload.password)
    if not user:
        # Fallback check: allow login by email alone if password wasn't set (e.g. legacy seed user)
        existing = repository.get_student_by_email(payload.email)
        if existing and not existing.get("password_hash"):
            user = existing
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

    return {
        "message": "Login successful",
        "user": user,
    }


@router.get("/leetcode-profile/{username}")
def get_leetcode_profile(username: str) -> Dict[str, Any]:
    """Fetch live LeetCode stats for UI handle validation."""
    profile = fetch_leetcode_profile(username)
    if profile.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=profile.get("message", f"LeetCode user {username} not found."),
        )
    return profile


@router.post("/sync-leetcode/{student_id}")
def sync_leetcode(student_id: int, payload: LeetCodeSyncRequest) -> Dict[str, Any]:
    """Sync LeetCode profile evidence into database for student and re-run debt agent."""
    user = repository.get_student(student_id=student_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    # Update student's leetcode_username in DB
    repository.update_student_leetcode_username(student_id, payload.leetcode_username)

    # Ingest evidence
    result = ingest_leetcode_evidence(student_id, payload.leetcode_username)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to sync LeetCode evidence."),
        )

    return {
        "message": "LeetCode evidence synced successfully",
        "sync_details": result,
    }

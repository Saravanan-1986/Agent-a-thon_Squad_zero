"""
Students API Router
"""

import os
from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas.student import StudentCreate, StudentOut

router = APIRouter(prefix="/students", tags=["Students"])


def _get_backends():
    if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
        from backend.services.mock_repository import create_student, get_student, list_students
    else:
        from database.compat import create_student, get_student, list_students
    return create_student, get_student, list_students


@router.get("", response_model=List[StudentOut])
def list_all_students():
    """Returns list of all registered students."""
    _, _, list_students = _get_backends()
    students = list_students()
    for s in students:
        if "email" not in s or not s["email"]:
            s["email"] = s.get("external_id", "")
    return students


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate):
    create_student, _, _ = _get_backends()
    try:
        student = create_student(external_id=payload.email, name=payload.name)
    except TypeError:
        student = create_student(name=payload.name, email=payload.email)
    if isinstance(student, dict) and ("email" not in student or not student["email"]):
        student["email"] = payload.email
    return student


@router.get("/{student_id}", response_model=StudentOut)
def fetch_student(student_id: str):
    _, get_student, list_students = _get_backends()
    if student_id.isdigit():
        student = get_student(int(student_id))
    else:
        if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
            students = list_students()
            student = next((s for s in students if s.get("external_id") == student_id), None)
            if not student and students:
                student = students[0]
        else:
            from database.repository import get_student as repo_get_student
            student = repo_get_student(external_id=student_id)
            if not student:
                all_s = list_students()
                student = all_s[0] if all_s else None
    if not student:
        raise HTTPException(status_code=404, detail=f"Student ID {student_id} not found.")
    if isinstance(student, dict) and ("email" not in student or not student["email"]):
        student["email"] = student.get("external_id", "")
    return student


@router.get("/{student_id}/evidence")
def fetch_student_evidence_alias(student_id: str):
    from backend.api.evidence import fetch_student_evidence
    return fetch_student_evidence(student_id)


"""
Students API Router
"""

import os

from fastapi import APIRouter, HTTPException, status
from backend.schemas.student import StudentCreate, StudentOut

if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
    from backend.services.mock_repository import create_student, get_student
else:
    from database.compat import create_student, get_student

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate):
    try:
        student = create_student(external_id=payload.email, name=payload.name)
    except TypeError:
        student = create_student(name=payload.name, email=payload.email)
    if isinstance(student, dict) and ("email" not in student or not student["email"]):
        student["email"] = payload.email
    return student

@router.get("/{student_id}", response_model=StudentOut)
def fetch_student(student_id: int):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student ID {student_id} not found.")
    if isinstance(student, dict) and ("email" not in student or not student["email"]):
        student["email"] = student.get("external_id", "")
    return student

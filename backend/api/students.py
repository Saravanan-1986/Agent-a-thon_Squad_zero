"""
Students API Router
"""

from fastapi import APIRouter, HTTPException, status
from backend.schemas.student import StudentCreate, StudentOut

try:
    from database.repository import create_student, get_student
except ImportError:
    from backend.services.mock_repository import create_student, get_student

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate):
    student = create_student(name=payload.name, email=payload.email)
    return student

@router.get("/{student_id}", response_model=StudentOut)
def fetch_student(student_id: int):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student ID {student_id} not found.")
    return student

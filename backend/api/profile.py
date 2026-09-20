"""
Knowledge Profile & Curriculum Topics API Router.

Provides real database-backed student profile status, evidence counts,
concept mastery, and topic verification lists.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status

from database import repository

router = APIRouter(prefix="/students", tags=["Student Knowledge Profile"])


@router.get("/{student_id}/knowledge-profile")
def get_knowledge_profile(student_id: int) -> Dict[str, Any]:
    """Return database-driven student knowledge profile."""
    user = repository.get_student(student_id)
    if not user:
        try:
            user = repository.create_student(external_id=f"student_{student_id}", name=f"Student {student_id}")
        except Exception:
            pass

    return repository.get_student_knowledge_profile(student_id)


@router.get("/{student_id}/topics")
def get_student_topics(student_id: int) -> Dict[str, Any]:
    """Return topics needing verification or practice for student."""
    user = repository.get_student(student_id)
    if not user:
        try:
            user = repository.create_student(external_id=f"student_{student_id}", name=f"Student {student_id}")
        except Exception:
            pass

    profile = repository.get_student_knowledge_profile(student_id)
    topics = []

    for sub in profile.get("subjects", []):
        for c in sub.get("concepts", []):
            topics.append({
                "concept_id": c["concept_id"],
                "concept_name": c["concept_name"],
                "category": c["category"],
                "verification_status": c["verification_status"],
                "has_debt": c["knowledge_debt"] is not None,
                "debt_status": c["knowledge_debt"]["status"] if c["knowledge_debt"] else None,
            })

    return {
        "student_id": student_id,
        "total_topics": len(topics),
        "topics": topics,
    }

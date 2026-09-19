from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

class InterventionCreate(BaseModel):
    debt_id: int
    version: int
    content: Dict[str, Any]

class InterventionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    debt_id: int
    version: int
    content: Dict[str, Any]
    mentor_status: str = "PENDING"
    created_at: Optional[datetime] = None

class MentorDecision(BaseModel):
    decision: str = Field(..., description="Decision must be 'approve', 'edit', or 'reject'")
    edited_content: Optional[Dict[str, Any]] = None

class VerificationSubmission(BaseModel):
    debt_id: int
    question: str
    student_answer: str
    target_status: Optional[str] = Field(
        None, 
        description="Must NOT be set directly to REPAID by client. Verified deterministically."
    )

class VerificationResultOut(BaseModel):
    passed: bool
    score: float
    new_debt_status: str
    feedback: str

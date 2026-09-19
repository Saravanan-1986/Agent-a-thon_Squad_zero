from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class EvidenceCreate(BaseModel):
    student_id: int
    concept_id: int
    source: str = Field(..., description="Source of evidence, e.g., 'quiz', 'coding_lab', 'exam'")
    score: float = Field(..., ge=0.0, le=100.0, description="Score percentage between 0 and 100")
    passed: bool

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    concept_id: int
    source: str
    score: float
    passed: bool
    timestamp: datetime

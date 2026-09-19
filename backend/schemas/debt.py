from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict

class DebtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    concept_id: int
    concept: Optional[str] = None
    concept_name: Optional[str] = None
    concept_code: Optional[str] = None
    root_cause: Optional[str] = None
    status: str
    severity: Any = 0.0
    severity_label: Optional[str] = None
    attempts: int = 0
    failed_interventions: int = 0
    root_cause_concept_id: Optional[int] = None
    evidence: Optional[List[Any]] = None
    interventions: Optional[List[Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DebtLedgerOut(BaseModel):
    student_id: int
    total_debts: int
    active_debts: int
    repaid_debts: int
    debts: List[DebtOut]

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class DebtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    concept_id: int
    status: str
    severity: float = 0.0
    attempts: int = 0
    failed_interventions: int = 0
    root_cause_concept_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DebtLedgerOut(BaseModel):
    student_id: int
    total_debts: int
    active_debts: int
    repaid_debts: int
    debts: List[DebtOut]

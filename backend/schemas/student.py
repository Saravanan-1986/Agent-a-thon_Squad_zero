from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class StudentCreate(BaseModel):
    name: str
    email: str

class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = ""
    external_id: Optional[str] = None
    created_at: Optional[datetime] = None

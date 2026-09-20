from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class StudentCreate(BaseModel):
    name: str
    email: str
    leetcode_username: Optional[str] = None

class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = ""
    external_id: Optional[str] = None
    leetcode_username: Optional[str] = None
    created_at: Optional[datetime] = None

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    leetcode_username: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class LeetCodeSyncRequest(BaseModel):
    leetcode_username: str


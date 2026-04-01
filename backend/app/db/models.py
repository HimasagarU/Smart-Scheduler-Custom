from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class Preferences(BaseModel):
    blackout_days: List[str] = Field(default_factory=list)
    reminder_lead_days: int = Field(default=1)

class User(BaseModel):
    name: str
    email: EmailStr
    password_hash: str
    organization: str = Field(default="DefaultOrg")
    preferences: Preferences = Field(default_factory=Preferences)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    organization: Optional[str] = "DefaultOrg"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    organization: str
    preferences: Preferences
    
class Event(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = ""
    start_date: str # "YYYY-MM-DD"
    end_date: str   # "YYYY-MM-DD"
    parent_event_id: Optional[str] = None
    is_organizer: bool = Field(default=True)
    shared_with: Optional[str] = None
    reminder_sent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    start_date: str
    end_date: str
    other_user_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

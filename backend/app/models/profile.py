from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class ProfileCreate(BaseModel):
    user_id: str
    name: str = Field(..., min_length=1, max_length=255)
    job_title: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    target_role_id: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    job_title: Optional[str] = None
    skills: Optional[list[str]] = None
    target_role_id: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    job_title: Optional[str] = None
    skills: list[str]
    target_role_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

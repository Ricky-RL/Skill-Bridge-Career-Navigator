from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class JobRole(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    avg_salary_range: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobRoleListParams(BaseModel):
    search: Optional[str] = None
    category: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

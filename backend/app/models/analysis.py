from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AnalysisRequest(BaseModel):
    user_skills: list[str] = Field(..., min_length=1)
    target_role_id: Optional[str] = None
    job_posting_id: Optional[str] = None


class SkillRecommendation(BaseModel):
    skill: str
    priority: int
    resources: list[dict] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    id: Optional[str] = None
    matching_skills: list[str]
    missing_skills: list[str]
    match_percentage: int = Field(ge=0, le=100)
    recommendations: list[SkillRecommendation] = Field(default_factory=list)
    estimated_time: Optional[str] = None
    ai_generated: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LearningResource(BaseModel):
    id: str
    skill_name: str
    resource_name: str
    resource_url: Optional[str] = None
    resource_type: Optional[str] = None
    platform: Optional[str] = None
    is_free: bool = True
    estimated_hours: Optional[int] = None

    class Config:
        from_attributes = True

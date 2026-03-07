from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AnalysisRequest(BaseModel):
    user_skills: list[str] = Field(..., min_length=1)
    target_role_id: Optional[str] = None
    job_posting_id: Optional[str] = None
    user_id: Optional[str] = None  # To fetch full profile for comprehensive analysis
    use_fallback: bool = False  # Toggle to force rule-based analysis instead of AI


class SkillRecommendation(BaseModel):
    skill: str
    priority: int
    resources: list[dict] = Field(default_factory=list)


class LevelQualification(BaseModel):
    qualified: bool = False
    user_level: str = "Entry Level"
    target_level: str = "Mid"
    years_gap: Optional[int] = None
    details: str = ""


class ExperienceMatch(BaseModel):
    education_match: bool = False
    education_details: Optional[str] = None
    experience_match: bool = False
    experience_details: Optional[str] = None
    certifications_match: bool = False
    certifications_details: Optional[str] = None
    projects_relevance: Optional[str] = None
    level_qualification: Optional[LevelQualification] = None


class AnalysisResponse(BaseModel):
    id: Optional[str] = None
    matching_skills: list[str]
    missing_skills: list[str]
    match_percentage: int = Field(ge=0, le=100)
    recommendations: list[SkillRecommendation] = Field(default_factory=list)
    estimated_time: Optional[str] = None
    profile_summary: Optional[str] = None  # AI-generated summary comparing profile to job
    experience_match: Optional[ExperienceMatch] = None  # Details about experience/education match
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

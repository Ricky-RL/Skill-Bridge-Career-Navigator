from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ParsedJobInfo(BaseModel):
    """Parsed job posting information from AI analysis"""
    title: str
    company: Optional[str] = None
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
    minimum_qualifications: list[str] = Field(default_factory=list)
    description: Optional[str] = None


class SavedAnalysisCreate(BaseModel):
    """Request model for saving an analysis"""
    user_id: str
    job_info: ParsedJobInfo
    analysis_result: dict  # Full analysis response
    job_description: Optional[str] = None  # Original raw job description


class SavedAnalysisResponse(BaseModel):
    """Response model for a saved analysis"""
    id: str
    user_id: str
    job_info: dict
    analysis_result: dict
    job_description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SavedAnalysisListItem(BaseModel):
    """Simplified response for listing saved analyses"""
    id: str
    job_title: str
    company: Optional[str] = None
    match_percentage: int
    created_at: datetime

    class Config:
        from_attributes = True

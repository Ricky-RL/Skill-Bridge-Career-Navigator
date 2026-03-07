"""Pydantic models for bulk role comparison feature."""

from pydantic import BaseModel, Field
from typing import Optional


class BulkComparisonRequest(BaseModel):
    """Request model for bulk role comparison."""
    user_id: str
    role_type: Optional[str] = None  # e.g., "Cloud Engineer"
    industries: list[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    max_jobs: int = Field(default=30, ge=5, le=50)


class SkillFrequency(BaseModel):
    """Skill frequency data across multiple jobs."""
    skill: str
    frequency: int  # Number of jobs requiring this skill
    percentage: float  # % of analyzed jobs
    user_has: bool  # Does the user have this skill?


class JobMatchSummary(BaseModel):
    """Summary of a single job match."""
    job_id: str
    title: str
    company: str
    industry: str
    experience_level: str
    match_percentage: int
    matching_skills: list[str]
    missing_skills: list[str]


class BulkComparisonResponse(BaseModel):
    """Response model for bulk role comparison."""
    total_jobs_analyzed: int
    market_readiness_score: int  # 0-100 weighted score
    most_requested_skills: list[SkillFrequency]
    most_missing_skills: list[SkillFrequency]
    job_matches: list[JobMatchSummary]
    avg_match_percentage: float
    best_fit_industries: list[str]

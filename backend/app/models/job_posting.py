from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class JobPosting(BaseModel):
    id: str
    company: str
    company_logo_url: Optional[str] = None
    title: str
    industry: str  # e.g., "Cloud & Infrastructure", "Security", "AI/ML"
    location: str
    employment_type: str = "Full-time"  # Full-time, Part-time, Contract
    experience_level: str  # Entry, Mid, Senior, Staff, Principal
    description: str
    responsibilities: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    required_experience_years: int = 0
    education_requirement: Optional[str] = None
    salary_range: Optional[str] = None
    benefits: list[str] = Field(default_factory=list)
    posted_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobPostingListParams(BaseModel):
    search: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# Available industries for filtering
INDUSTRIES = [
    "Cloud & Infrastructure",
    "Cybersecurity",
    "AI & Machine Learning",
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Mobile Development",
    "Data Engineering",
    "DevOps & SRE",
    "Product Management",
]

# Available companies
COMPANIES = [
    "Google",
    "Amazon",
    "Palo Alto Networks",
    "Apple",
    "Meta",
]

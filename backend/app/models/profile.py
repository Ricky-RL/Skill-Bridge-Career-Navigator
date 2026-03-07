from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class Certificate(BaseModel):
    name: str
    issuer: Optional[str] = None
    date_obtained: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None


class WorkExperience(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    highlights: list[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)
    url: Optional[str] = None


class ProfileCreate(BaseModel):
    user_id: str
    name: str = Field(..., min_length=1, max_length=255)
    job_title: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: list[str] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    certifications: list[dict] = Field(default_factory=list)
    work_experience: list[dict] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    target_experience_level: Optional[str] = None
    target_role_id: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    job_title: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: Optional[list[str]] = None
    education: Optional[list[dict]] = None
    certifications: Optional[list[dict]] = None
    work_experience: Optional[list[dict]] = None
    projects: Optional[list[dict]] = None
    target_industries: Optional[list[str]] = None
    target_experience_level: Optional[str] = None
    target_role_id: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    job_title: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: list[str]
    education: list[dict] = Field(default_factory=list)
    certifications: list[dict] = Field(default_factory=list)
    work_experience: list[dict] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    target_experience_level: Optional[str] = None
    target_role_id: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

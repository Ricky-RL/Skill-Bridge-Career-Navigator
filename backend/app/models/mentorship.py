"""Models for mentorship system."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MentorStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    INACTIVE = "inactive"


class SessionStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MentorProfileCreate(BaseModel):
    """Request model for creating mentor profile."""
    user_id: str
    bio: str = Field(..., min_length=50, max_length=1000)
    expertise_areas: list[str] = Field(..., min_items=1)
    industries: list[str] = Field(default_factory=list)
    years_experience: int = Field(..., ge=2)
    job_title: str
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    max_mentees: int = Field(default=3, ge=1, le=10)
    availability_hours_per_week: int = Field(default=2, ge=1, le=20)
    preferred_meeting_type: str = Field(default="video")  # video, chat, both


class MentorProfileUpdate(BaseModel):
    """Request model for updating mentor profile."""
    bio: Optional[str] = Field(None, min_length=50, max_length=1000)
    expertise_areas: Optional[list[str]] = Field(None, min_items=1)
    industries: Optional[list[str]] = None
    years_experience: Optional[int] = Field(None, ge=2)
    job_title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    max_mentees: Optional[int] = Field(None, ge=1, le=10)
    availability_hours_per_week: Optional[int] = Field(None, ge=1, le=20)
    preferred_meeting_type: Optional[str] = None
    status: Optional[MentorStatus] = None


class MentorProfile(BaseModel):
    """Response model for mentor profile."""
    id: str
    user_id: Optional[str] = None  # Optional for sample mentors
    name: str
    bio: str
    expertise_areas: list[str]
    industries: list[str]
    years_experience: int
    job_title: str
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    max_mentees: int
    current_mentees: int
    availability_hours_per_week: int
    preferred_meeting_type: str
    status: MentorStatus
    rating: Optional[float] = None
    total_sessions: int
    created_at: str


class MentorMatch(BaseModel):
    """Mentor match with compatibility score."""
    mentor: MentorProfile
    match_score: int  # 0-100
    matching_skills: list[str]
    matching_industries: list[str]
    reason: str


class MentorshipRequestCreate(BaseModel):
    """Request to connect with a mentor."""
    mentee_id: str
    mentor_id: str
    message: str = Field(..., min_length=20, max_length=500)
    goals: list[str] = Field(..., min_items=1)


class MentorshipConnection(BaseModel):
    """Active mentorship connection."""
    id: str
    mentor_id: str
    mentee_id: str
    mentor_name: str
    mentee_name: str
    status: str  # pending, active, completed, declined
    goals: list[str]
    message: str
    sessions_completed: int
    created_at: str
    updated_at: str


class SessionCreate(BaseModel):
    """Request to schedule a mentorship session."""
    connection_id: str
    scheduled_time: datetime
    duration_minutes: int = Field(default=30, ge=15, le=120)
    topic: str
    notes: Optional[str] = None


class MentorshipSession(BaseModel):
    """Mentorship session details."""
    id: str
    connection_id: str
    mentor_name: str
    mentee_name: str
    scheduled_time: str
    duration_minutes: int
    topic: str
    notes: Optional[str] = None
    status: SessionStatus
    meeting_link: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None

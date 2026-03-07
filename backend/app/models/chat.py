from pydantic import BaseModel, Field
from typing import Optional


class ChatMessage(BaseModel):
    """A single message in the chat conversation."""
    role: str  # "user" or "assistant"
    content: str


class ChatContext(BaseModel):
    """Context passed to the chatbot for personalized responses."""
    # User profile context
    user_name: Optional[str] = None
    user_skills: list[str] = Field(default_factory=list)
    years_of_experience: Optional[int] = None
    education: list[dict] = Field(default_factory=list)
    certifications: list[dict] = Field(default_factory=list)
    work_experience: list[dict] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)

    # Current job context (if viewing a job)
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    job_required_skills: list[str] = Field(default_factory=list)
    job_nice_to_have_skills: list[str] = Field(default_factory=list)
    job_responsibilities: list[str] = Field(default_factory=list)
    job_experience_level: Optional[str] = None

    # Analysis context (if analysis has been run)
    matching_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    match_percentage: Optional[int] = None
    profile_summary: Optional[str] = None
    recommendations: list[dict] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """Request to send a message to the chatbot."""
    message: str = Field(..., min_length=1, max_length=2000)
    context: ChatContext
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from the chatbot."""
    message: str
    suggestions: list[str] = Field(default_factory=list)  # Quick reply suggestions

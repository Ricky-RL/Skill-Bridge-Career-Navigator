"""Router for mentorship endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from app.services.supabase_client import get_db
from app.models.mentorship import (
    MentorProfileCreate,
    MentorProfileUpdate,
    MentorProfile,
    MentorMatch,
    MentorshipRequestCreate,
    MentorshipConnection,
    SessionCreate,
    MentorshipSession,
    MentorStatus,
    SessionStatus,
)
from typing import Optional
from datetime import datetime
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)


def _calculate_match_score(
    mentor_expertise: list[str],
    mentor_industries: list[str],
    user_skills: list[str],
    user_industries: list[str],
    missing_skills: list[str],
) -> tuple[int, list[str], list[str], str]:
    """Calculate mentor-mentee match score."""
    mentor_expertise_lower = [e.lower() for e in mentor_expertise]
    user_skills_lower = [s.lower() for s in user_skills]
    user_industries_lower = [i.lower() for i in user_industries]
    missing_skills_lower = [s.lower() for s in missing_skills]

    # Skills the mentor can teach that user wants to learn
    matching_skills = []
    for skill in mentor_expertise:
        skill_lower = skill.lower()
        # Mentor has expertise in skill user is missing
        if skill_lower in missing_skills_lower:
            matching_skills.append(skill)
        # Or skill user already has (can help advance)
        elif skill_lower in user_skills_lower:
            matching_skills.append(skill)

    # Matching industries
    matching_industries = []
    for ind in mentor_industries:
        if ind.lower() in user_industries_lower:
            matching_industries.append(ind)

    # Calculate score
    skill_score = min(len(matching_skills) * 15, 60)  # Max 60 points for skills
    industry_score = min(len(matching_industries) * 20, 40)  # Max 40 points for industry

    total_score = skill_score + industry_score

    # Generate reason
    reasons = []
    if matching_skills:
        reasons.append(f"Expert in {', '.join(matching_skills[:3])}")
    if matching_industries:
        reasons.append(f"Experience in {', '.join(matching_industries[:2])}")

    reason = ". ".join(reasons) if reasons else "General mentorship experience"

    return total_score, matching_skills, matching_industries, reason


@router.post("/mentors", response_model=MentorProfile)
async def become_mentor(
    profile: MentorProfileCreate,
    db: Client = Depends(get_db)
):
    """Register as a mentor."""
    try:
        # Get user name from profile
        user_response = db.table("user_profiles").select("name").eq("user_id", profile.user_id).execute()
        user_name = user_response.data[0]["name"] if user_response.data else "Anonymous"

        # Check if already a mentor
        existing = db.table("mentor_profiles").select("id").eq("user_id", profile.user_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Already registered as a mentor")

        mentor_data = {
            "id": str(uuid.uuid4()),
            "user_id": profile.user_id,
            "name": user_name,
            "bio": profile.bio,
            "expertise_areas": profile.expertise_areas,
            "industries": profile.industries,
            "years_experience": profile.years_experience,
            "job_title": profile.job_title,
            "company": profile.company,
            "linkedin_url": profile.linkedin_url,
            "max_mentees": profile.max_mentees,
            "current_mentees": 0,
            "availability_hours_per_week": profile.availability_hours_per_week,
            "preferred_meeting_type": profile.preferred_meeting_type,
            "status": MentorStatus.AVAILABLE.value,
            "rating": None,
            "total_sessions": 0,
            "created_at": datetime.utcnow().isoformat(),
        }

        response = db.table("mentor_profiles").insert(mentor_data).execute()
        return MentorProfile(**response.data[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mentor profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentors", response_model=list[MentorProfile])
async def list_mentors(
    expertise: Optional[str] = None,
    industry: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=50),
    db: Client = Depends(get_db)
):
    """List available mentors."""
    try:
        query = db.table("mentor_profiles").select("*").eq("status", MentorStatus.AVAILABLE.value)

        response = query.limit(limit).execute()
        mentors = response.data or []

        # Filter by expertise/industry if specified
        if expertise:
            expertise_lower = expertise.lower()
            mentors = [m for m in mentors if any(expertise_lower in e.lower() for e in m.get("expertise_areas", []))]

        if industry:
            industry_lower = industry.lower()
            mentors = [m for m in mentors if any(industry_lower in i.lower() for i in m.get("industries", []))]

        return [MentorProfile(**m) for m in mentors]

    except Exception as e:
        logger.error(f"Error listing mentors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentors/matches/{user_id}", response_model=list[MentorMatch])
async def find_mentor_matches(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=20),
    db: Client = Depends(get_db)
):
    """Find mentor matches based on user's profile and skill gaps."""
    try:
        # Get user profile
        user_response = db.table("user_profiles").select("*").eq("user_id", user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        user_profile = user_response.data[0]
        user_skills = user_profile.get("skills", [])
        user_industries = user_profile.get("target_industries", [])

        # Get user's missing skills from saved analyses
        analyses_response = db.table("saved_analyses").select("analysis_result").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()

        missing_skills = set()
        for analysis in analyses_response.data or []:
            result = analysis.get("analysis_result", {})
            missing_skills.update(result.get("missing_skills", []))

        # Get available mentors
        mentors_response = db.table("mentor_profiles").select("*").eq("status", MentorStatus.AVAILABLE.value).execute()
        mentors = mentors_response.data or []

        # Calculate match scores
        matches = []
        for mentor in mentors:
            # Skip if mentor is the user
            if mentor["user_id"] == user_id:
                continue

            # Skip if mentor has max mentees
            if mentor.get("current_mentees", 0) >= mentor.get("max_mentees", 3):
                continue

            score, matching_skills, matching_industries, reason = _calculate_match_score(
                mentor.get("expertise_areas", []),
                mentor.get("industries", []),
                user_skills,
                user_industries,
                list(missing_skills)
            )

            if score > 0:
                matches.append(MentorMatch(
                    mentor=MentorProfile(**mentor),
                    match_score=score,
                    matching_skills=matching_skills,
                    matching_industries=matching_industries,
                    reason=reason
                ))

        # Sort by match score
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:limit]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding mentor matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentors/{mentor_id}", response_model=MentorProfile)
async def get_mentor(
    mentor_id: str,
    db: Client = Depends(get_db)
):
    """Get mentor profile by ID."""
    try:
        response = db.table("mentor_profiles").select("*").eq("id", mentor_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Mentor not found")
        return MentorProfile(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mentor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections", response_model=MentorshipConnection)
async def request_mentorship(
    request: MentorshipRequestCreate,
    db: Client = Depends(get_db)
):
    """Request mentorship from a mentor."""
    try:
        # Verify mentor exists and is available
        mentor_response = db.table("mentor_profiles").select("*").eq("id", request.mentor_id).execute()
        if not mentor_response.data:
            raise HTTPException(status_code=404, detail="Mentor not found")

        mentor = mentor_response.data[0]
        if mentor["status"] != MentorStatus.AVAILABLE.value:
            raise HTTPException(status_code=400, detail="Mentor is not available")

        if mentor.get("current_mentees", 0) >= mentor.get("max_mentees", 3):
            raise HTTPException(status_code=400, detail="Mentor has reached maximum mentees")

        # Get mentee name
        mentee_response = db.table("user_profiles").select("name").eq("user_id", request.mentee_id).execute()
        mentee_name = mentee_response.data[0]["name"] if mentee_response.data else "Anonymous"

        # Check for existing connection
        existing = db.table("mentorship_connections").select("id").eq("mentor_id", request.mentor_id).eq("mentee_id", request.mentee_id).in_("status", ["pending", "active"]).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Connection already exists")

        connection_data = {
            "id": str(uuid.uuid4()),
            "mentor_id": request.mentor_id,
            "mentee_id": request.mentee_id,
            "mentor_name": mentor["name"],
            "mentee_name": mentee_name,
            "status": "pending",
            "goals": request.goals,
            "message": request.message,
            "sessions_completed": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        response = db.table("mentorship_connections").insert(connection_data).execute()
        return MentorshipConnection(**response.data[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mentorship request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/connections/{connection_id}/accept")
async def accept_mentorship(
    connection_id: str,
    db: Client = Depends(get_db)
):
    """Accept a mentorship request (mentor only)."""
    try:
        # Get connection
        conn_response = db.table("mentorship_connections").select("*").eq("id", connection_id).execute()
        if not conn_response.data:
            raise HTTPException(status_code=404, detail="Connection not found")

        connection = conn_response.data[0]
        if connection["status"] != "pending":
            raise HTTPException(status_code=400, detail="Connection is not pending")

        # Update connection status
        db.table("mentorship_connections").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", connection_id).execute()

        # Increment mentor's current_mentees
        db.table("mentor_profiles").update({
            "current_mentees": connection.get("current_mentees", 0) + 1
        }).eq("id", connection["mentor_id"]).execute()

        return {"message": "Mentorship request accepted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting mentorship: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/connections/{connection_id}/decline")
async def decline_mentorship(
    connection_id: str,
    db: Client = Depends(get_db)
):
    """Decline a mentorship request."""
    try:
        conn_response = db.table("mentorship_connections").select("*").eq("id", connection_id).execute()
        if not conn_response.data:
            raise HTTPException(status_code=404, detail="Connection not found")

        db.table("mentorship_connections").update({
            "status": "declined",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", connection_id).execute()

        return {"message": "Mentorship request declined"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining mentorship: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections", response_model=list[MentorshipConnection])
async def get_user_connections(
    user_id: str = Query(...),
    role: str = Query(default="both"),  # mentor, mentee, both
    db: Client = Depends(get_db)
):
    """Get user's mentorship connections."""
    try:
        connections = []

        if role in ["mentor", "both"]:
            # Get mentor profile ID first
            mentor_response = db.table("mentor_profiles").select("id").eq("user_id", user_id).execute()
            if mentor_response.data:
                mentor_id = mentor_response.data[0]["id"]
                mentor_conns = db.table("mentorship_connections").select("*").eq("mentor_id", mentor_id).execute()
                connections.extend(mentor_conns.data or [])

        if role in ["mentee", "both"]:
            mentee_conns = db.table("mentorship_connections").select("*").eq("mentee_id", user_id).execute()
            connections.extend(mentee_conns.data or [])

        # Remove duplicates
        seen = set()
        unique = []
        for conn in connections:
            if conn["id"] not in seen:
                seen.add(conn["id"])
                unique.append(conn)

        return [MentorshipConnection(**c) for c in unique]

    except Exception as e:
        logger.error(f"Error getting connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentor-profile/{user_id}", response_model=Optional[MentorProfile])
async def get_user_mentor_profile(
    user_id: str,
    db: Client = Depends(get_db)
):
    """Get user's mentor profile if they are a mentor."""
    try:
        response = db.table("mentor_profiles").select("*").eq("user_id", user_id).execute()
        if not response.data:
            return None
        return MentorProfile(**response.data[0])
    except Exception as e:
        logger.error(f"Error getting mentor profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mentor-profile/{user_id}", response_model=MentorProfile)
async def update_mentor_profile(
    user_id: str,
    update: MentorProfileUpdate,
    db: Client = Depends(get_db)
):
    """Update user's mentor profile."""
    try:
        # Get existing profile
        existing = db.table("mentor_profiles").select("*").eq("user_id", user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Mentor profile not found")

        # Build update data (only include non-None fields)
        update_data = {}
        if update.bio is not None:
            update_data["bio"] = update.bio
        if update.expertise_areas is not None:
            update_data["expertise_areas"] = update.expertise_areas
        if update.industries is not None:
            update_data["industries"] = update.industries
        if update.years_experience is not None:
            update_data["years_experience"] = update.years_experience
        if update.job_title is not None:
            update_data["job_title"] = update.job_title
        if update.company is not None:
            update_data["company"] = update.company
        if update.linkedin_url is not None:
            update_data["linkedin_url"] = update.linkedin_url
        if update.max_mentees is not None:
            update_data["max_mentees"] = update.max_mentees
        if update.availability_hours_per_week is not None:
            update_data["availability_hours_per_week"] = update.availability_hours_per_week
        if update.preferred_meeting_type is not None:
            update_data["preferred_meeting_type"] = update.preferred_meeting_type
        if update.status is not None:
            update_data["status"] = update.status.value

        if not update_data:
            # No changes, return existing profile
            return MentorProfile(**existing.data[0])

        update_data["updated_at"] = datetime.utcnow().isoformat()

        response = db.table("mentor_profiles").update(update_data).eq("user_id", user_id).execute()
        return MentorProfile(**response.data[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mentor profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions", response_model=MentorshipSession)
async def schedule_session(
    session: SessionCreate,
    db: Client = Depends(get_db)
):
    """Schedule a mentorship session."""
    try:
        # Verify connection is active
        conn_response = db.table("mentorship_connections").select("*").eq("id", session.connection_id).execute()
        if not conn_response.data:
            raise HTTPException(status_code=404, detail="Connection not found")

        connection = conn_response.data[0]
        if connection["status"] != "active":
            raise HTTPException(status_code=400, detail="Connection is not active")

        session_data = {
            "id": str(uuid.uuid4()),
            "connection_id": session.connection_id,
            "mentor_name": connection["mentor_name"],
            "mentee_name": connection["mentee_name"],
            "scheduled_time": session.scheduled_time.isoformat(),
            "duration_minutes": session.duration_minutes,
            "topic": session.topic,
            "notes": session.notes,
            "status": SessionStatus.PENDING.value,
            "meeting_link": None,
            "feedback": None,
            "rating": None,
        }

        response = db.table("mentorship_sessions").insert(session_data).execute()
        return MentorshipSession(**response.data[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=list[MentorshipSession])
async def get_sessions(
    connection_id: str = Query(...),
    db: Client = Depends(get_db)
):
    """Get sessions for a connection."""
    try:
        response = db.table("mentorship_sessions").select("*").eq("connection_id", connection_id).order("scheduled_time", desc=True).execute()
        return [MentorshipSession(**s) for s in response.data or []]
    except Exception as e:
        logger.error(f"Error getting sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentee/{connection_id}")
async def get_mentee_details(
    connection_id: str,
    db: Client = Depends(get_db)
):
    """Get mentee profile, saved analyses, and sessions for a mentor to view."""
    try:
        # Get the connection
        conn_response = db.table("mentorship_connections").select("*").eq("id", connection_id).execute()
        if not conn_response.data:
            raise HTTPException(status_code=404, detail="Connection not found")

        connection = conn_response.data[0]
        mentee_id = connection["mentee_id"]

        # Get mentee profile
        profile_response = db.table("user_profiles").select("*").eq("user_id", mentee_id).execute()
        mentee_profile = profile_response.data[0] if profile_response.data else None

        # Get mentee's saved analyses
        analyses_response = db.table("saved_analyses").select(
            "id, job_info, analysis_result, created_at"
        ).eq("user_id", mentee_id).order("created_at", desc=True).limit(10).execute()

        saved_analyses = []
        for row in analyses_response.data or []:
            job_info = row.get("job_info", {})
            analysis_result = row.get("analysis_result", {})
            saved_analyses.append({
                "id": row["id"],
                "job_title": job_info.get("title", "Unknown Role"),
                "company": job_info.get("company"),
                "match_percentage": analysis_result.get("match_percentage", 0),
                "missing_skills": analysis_result.get("missing_skills", [])[:5],
                "created_at": row["created_at"],
            })

        # Get sessions for this connection
        sessions_response = db.table("mentorship_sessions").select("*").eq("connection_id", connection_id).order("scheduled_time", desc=True).execute()
        sessions = [MentorshipSession(**s) for s in sessions_response.data or []]

        return {
            "connection": MentorshipConnection(**connection),
            "profile": mentee_profile,
            "saved_analyses": saved_analyses,
            "sessions": sessions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mentee details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentor-details/{connection_id}")
async def get_mentor_details_for_mentee(
    connection_id: str,
    db: Client = Depends(get_db)
):
    """Get mentor profile and sessions for a mentee to view."""
    try:
        # Get the connection
        conn_response = db.table("mentorship_connections").select("*").eq("id", connection_id).execute()
        if not conn_response.data:
            raise HTTPException(status_code=404, detail="Connection not found")

        connection = conn_response.data[0]
        mentor_id = connection["mentor_id"]

        # Get mentor profile
        mentor_response = db.table("mentor_profiles").select("*").eq("id", mentor_id).execute()
        if not mentor_response.data:
            raise HTTPException(status_code=404, detail="Mentor profile not found")

        mentor_profile = MentorProfile(**mentor_response.data[0])

        # Get sessions for this connection
        sessions_response = db.table("mentorship_sessions").select("*").eq("connection_id", connection_id).order("scheduled_time", desc=True).execute()
        sessions = [MentorshipSession(**s) for s in sessions_response.data or []]

        return {
            "connection": MentorshipConnection(**connection),
            "mentor": mentor_profile,
            "sessions": sessions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mentor details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

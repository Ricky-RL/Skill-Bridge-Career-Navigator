"""Router for bulk role comparison endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from app.services.supabase_client import get_db
from app.models.bulk_comparison import (
    BulkComparisonRequest,
    BulkComparisonResponse,
    SkillFrequency,
    JobMatchSummary
)
from app.services.bulk_analyzer import analyze_bulk_jobs
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=BulkComparisonResponse)
async def compare_bulk_roles(
    request: BulkComparisonRequest,
    db: Client = Depends(get_db)
):
    """
    Compare user profile against multiple jobs matching the criteria.

    Uses rule-based analysis for speed and efficiency (no AI API calls).
    Returns aggregated insights about skill demand and job matches.
    """
    try:
        # 1. Fetch user profile
        profile_response = db.table("user_profiles").select("*").eq("user_id", request.user_id).execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        user_profile = profile_response.data[0]
        user_skills = user_profile.get("skills", [])

        if not user_skills:
            raise HTTPException(status_code=400, detail="No skills in user profile. Please add skills first.")

        # 2. Build job query with filters
        query = db.table("job_postings").select("*")

        # Filter by role type (search in title)
        if request.role_type:
            query = query.ilike("title", f"%{request.role_type}%")

        # Filter by industries
        if request.industries:
            query = query.in_("industry", request.industries)

        # Filter by experience level
        if request.experience_level:
            query = query.eq("experience_level", request.experience_level)

        # Apply limit
        query = query.limit(request.max_jobs)

        # 3. Fetch matching jobs
        jobs_response = query.execute()
        job_postings = jobs_response.data or []

        if not job_postings:
            return BulkComparisonResponse(
                total_jobs_analyzed=0,
                market_readiness_score=0,
                most_requested_skills=[],
                most_missing_skills=[],
                job_matches=[],
                avg_match_percentage=0.0,
                best_fit_industries=[]
            )

        # 4. Fetch learning resources (for recommendations)
        resources_response = db.table("learning_resources").select("*").execute()
        resources = resources_response.data or []

        # 5. Run bulk analysis
        result = analyze_bulk_jobs(
            user_skills=user_skills,
            job_postings=job_postings,
            resources=resources,
            user_profile=user_profile
        )

        # 6. Convert to response models
        return BulkComparisonResponse(
            total_jobs_analyzed=result["total_jobs_analyzed"],
            market_readiness_score=result["market_readiness_score"],
            most_requested_skills=[
                SkillFrequency(**s) for s in result["most_requested_skills"]
            ],
            most_missing_skills=[
                SkillFrequency(**s) for s in result["most_missing_skills"]
            ],
            job_matches=[
                JobMatchSummary(**j) for j in result["job_matches"]
            ],
            avg_match_percentage=result["avg_match_percentage"],
            best_fit_industries=result["best_fit_industries"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk comparison error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/industries")
async def get_available_industries(db: Client = Depends(get_db)):
    """Get list of available industries for filtering."""
    try:
        response = db.table("job_postings").select("industry").execute()
        industries = list(set(row["industry"] for row in response.data if row.get("industry")))
        industries.sort()
        return {"industries": industries}
    except Exception as e:
        logger.error(f"Error fetching industries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/role-types")
async def get_available_role_types():
    """Get suggested role types for filtering."""
    return {
        "role_types": [
            "Cloud Engineer",
            "Backend Developer",
            "Frontend Developer",
            "Full Stack Developer",
            "DevOps Engineer",
            "Data Engineer",
            "Machine Learning Engineer",
            "Security Engineer",
            "Site Reliability Engineer",
            "Platform Engineer",
            "Software Engineer",
            "Solutions Architect"
        ]
    }

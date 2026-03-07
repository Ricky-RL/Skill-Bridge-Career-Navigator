from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from supabase import Client
from app.models.analysis import AnalysisRequest, AnalysisResponse, LearningResource
from app.services.supabase_client import get_db
from app.services.ai_analyzer import analyze_gap_with_ai
from app.services.fallback_analyzer import analyze_gap_fallback
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=AnalysisResponse)
async def analyze_skills(request: AnalysisRequest, db: Client = Depends(get_db)):
    """
    Analyze skill gap between user skills and target role.

    Uses AI analysis with automatic fallback to rule-based matching.
    """
    try:
        # Get target role
        role_result = db.table("job_roles").select("*").eq("id", request.target_role_id).execute()
        if not role_result.data:
            raise HTTPException(status_code=404, detail="Target role not found")

        target_role = role_result.data[0]

        # Get learning resources for potential recommendations
        resources_result = db.table("learning_resources").select("*").execute()
        resources = resources_result.data or []

        # Try AI analysis first
        try:
            analysis = await analyze_gap_with_ai(
                user_skills=request.user_skills,
                target_role=target_role,
                resources=resources
            )
            logger.info("AI analysis completed successfully")
        except Exception as ai_error:
            # Fall back to rule-based analysis
            logger.warning(f"AI analysis failed, using fallback: {ai_error}")
            analysis = analyze_gap_fallback(
                user_skills=request.user_skills,
                required_skills=target_role.get("required_skills", []),
                nice_to_have_skills=target_role.get("nice_to_have_skills", []),
                resources=resources
            )

        return AnalysisResponse(
            matching_skills=analysis.get("matching_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            match_percentage=analysis.get("match_percentage", 0),
            recommendations=analysis.get("recommendations", []),
            estimated_time=analysis.get("estimated_time"),
            ai_generated=analysis.get("ai_generated", False),
            created_at=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resources", response_model=list[LearningResource])
async def get_resources(
    skill: Optional[str] = Query(None, description="Filter by skill name"),
    is_free: Optional[bool] = Query(None, description="Filter by free resources"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    limit: int = Query(50, ge=1, le=100),
    db: Client = Depends(get_db)
):
    """Get learning resources with optional filters."""
    try:
        query = db.table("learning_resources").select("*")

        if skill:
            query = query.ilike("skill_name", f"%{skill}%")

        if is_free is not None:
            query = query.eq("is_free", is_free)

        if platform:
            query = query.ilike("platform", f"%{platform}%")

        query = query.limit(limit)
        result = query.execute()

        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

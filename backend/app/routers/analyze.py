from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from pydantic import BaseModel, Field
from supabase import Client
from app.models.analysis import AnalysisRequest, AnalysisResponse, LearningResource, ExperienceMatch, LevelQualification
from app.services.supabase_client import get_db
from app.services.ai_analyzer import analyze_gap_with_ai, generate_interview_questions, evaluate_level_qualification
from app.services.fallback_analyzer import analyze_gap_fallback
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=AnalysisResponse)
async def analyze_skills(request: AnalysisRequest, db: Client = Depends(get_db)):
    """
    Analyze skill gap between user profile and target role or job posting.

    Uses AI analysis with automatic fallback to rule-based matching.
    Considers full profile including education, experience, certifications, and projects.
    """
    try:
        # Fetch user profile if user_id is provided
        user_profile = None
        if request.user_id:
            try:
                profile_result = db.table("user_profiles").select("*").eq("user_id", request.user_id).execute()
                if profile_result.data:
                    user_profile = profile_result.data[0]
                    logger.info(f"Loaded user profile for comprehensive analysis")
            except Exception as e:
                logger.warning(f"Could not load user profile: {e}")

        # Determine the target (job posting or generic role)
        if request.job_posting_id:
            # Analyze against a specific job posting
            posting_result = db.table("job_postings").select("*").eq("id", request.job_posting_id).execute()
            if not posting_result.data:
                raise HTTPException(status_code=404, detail="Job posting not found")

            job_posting = posting_result.data[0]
            target_role = {
                "title": f"{job_posting['title']} at {job_posting['company']}",
                "company": job_posting.get("company"),
                "required_skills": job_posting.get("required_skills", []),
                "nice_to_have_skills": job_posting.get("preferred_skills", []),
                "description": job_posting.get("about_the_job", ""),
                "experience_level": job_posting.get("experience_level"),
                "responsibilities": job_posting.get("responsibilities", []),
                "minimum_qualifications": job_posting.get("minimum_qualifications", []),
                "preferred_qualifications": job_posting.get("preferred_qualifications", [])
            }
        elif request.target_role_id:
            # Analyze against a generic role
            role_result = db.table("job_roles").select("*").eq("id", request.target_role_id).execute()
            if not role_result.data:
                raise HTTPException(status_code=404, detail="Target role not found")
            target_role = role_result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Either target_role_id or job_posting_id is required")

        # Get learning resources for potential recommendations
        resources_result = db.table("learning_resources").select("*").execute()
        resources = resources_result.data or []

        # Use fallback if requested, otherwise try AI first
        if request.use_fallback:
            logger.info("Using rule-based fallback analysis (user requested)")
            analysis = analyze_gap_fallback(
                user_skills=request.user_skills,
                required_skills=target_role.get("required_skills", []),
                nice_to_have_skills=target_role.get("nice_to_have_skills", []),
                resources=resources,
                user_profile=user_profile,
                target_role=target_role
            )
        else:
            # Try AI analysis first
            try:
                analysis = await analyze_gap_with_ai(
                    user_skills=request.user_skills,
                    target_role=target_role,
                    resources=resources,
                    user_profile=user_profile
                )
                logger.info("AI analysis completed successfully")
            except Exception as ai_error:
                # Fall back to rule-based analysis
                logger.warning(f"AI analysis failed, using fallback: {ai_error}")
                analysis = analyze_gap_fallback(
                    user_skills=request.user_skills,
                    required_skills=target_role.get("required_skills", []),
                    nice_to_have_skills=target_role.get("nice_to_have_skills", []),
                    resources=resources,
                    user_profile=user_profile,
                    target_role=target_role
                )

        # Build experience match object if present
        experience_match = None
        if analysis.get("experience_match"):
            exp = analysis["experience_match"]
            experience_match = ExperienceMatch(
                education_match=exp.get("education_match", False),
                education_details=exp.get("education_details"),
                experience_match=exp.get("experience_match", False),
                experience_details=exp.get("experience_details"),
                certifications_match=exp.get("certifications_match", False),
                certifications_details=exp.get("certifications_details"),
                projects_relevance=exp.get("projects_relevance")
            )

        # Add level qualification evaluation
        level_qual = None
        if user_profile and target_role.get("experience_level"):
            level_qual_data = evaluate_level_qualification(
                user_profile=user_profile,
                target_level=target_role.get("experience_level"),
                required_years=target_role.get("required_experience_years", 0) if request.job_posting_id else 0
            )
            level_qual = LevelQualification(**level_qual_data)

            if experience_match:
                experience_match.level_qualification = level_qual
            else:
                experience_match = ExperienceMatch(level_qualification=level_qual)

        return AnalysisResponse(
            matching_skills=analysis.get("matching_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            match_percentage=analysis.get("match_percentage", 0),
            recommendations=analysis.get("recommendations", []),
            estimated_time=analysis.get("estimated_time"),
            profile_summary=analysis.get("profile_summary"),
            experience_match=experience_match,
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


class DescriptionAnalysisRequest(BaseModel):
    user_skills: list[str] = Field(..., min_length=1)
    job_description: str = Field(..., min_length=50)
    user_id: Optional[str] = None
    use_fallback: bool = False


class ParsedJobInfo(BaseModel):
    title: str
    company: Optional[str] = None
    required_skills: list[str]
    nice_to_have_skills: list[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
    minimum_qualifications: list[str] = Field(default_factory=list)
    description: Optional[str] = None


class DescriptionAnalysisResponse(BaseModel):
    parsed_job: ParsedJobInfo
    analysis: AnalysisResponse


@router.post("/from-description", response_model=DescriptionAnalysisResponse)
async def analyze_from_description(request: DescriptionAnalysisRequest, db: Client = Depends(get_db)):
    """
    Analyze skill gap from a raw job description text.

    Parses the job description using AI to extract job details, then performs analysis.
    """
    try:
        from app.services.ai_analyzer import parse_job_description

        # Fetch user profile if user_id is provided
        user_profile = None
        if request.user_id:
            try:
                profile_result = db.table("user_profiles").select("*").eq("user_id", request.user_id).execute()
                if profile_result.data:
                    user_profile = profile_result.data[0]
                    logger.info("Loaded user profile for comprehensive analysis")
            except Exception as e:
                logger.warning(f"Could not load user profile: {e}")

        # Parse the job description using AI
        logger.info("Parsing job description with AI...")
        parsed_job = await parse_job_description(request.job_description)
        logger.info(f"Parsed job: {parsed_job.get('title', 'Unknown')}")

        # Build target role from parsed job
        target_role = {
            "title": parsed_job.get("title") or "Software Engineer",
            "company": parsed_job.get("company"),
            "required_skills": parsed_job.get("required_skills") or [],
            "nice_to_have_skills": parsed_job.get("nice_to_have_skills") or [],
            "description": parsed_job.get("description") or request.job_description[:500],
            "experience_level": parsed_job.get("experience_level"),
            "responsibilities": parsed_job.get("responsibilities") or [],
            "minimum_qualifications": parsed_job.get("minimum_qualifications") or [],
            "preferred_qualifications": parsed_job.get("preferred_qualifications") or []
        }

        # Get learning resources
        resources_result = db.table("learning_resources").select("*").execute()
        resources = resources_result.data or []

        # Run analysis
        if request.use_fallback:
            analysis = analyze_gap_fallback(
                user_skills=request.user_skills,
                required_skills=target_role.get("required_skills", []),
                nice_to_have_skills=target_role.get("nice_to_have_skills", []),
                resources=resources,
                user_profile=user_profile,
                target_role=target_role
            )
        else:
            try:
                analysis = await analyze_gap_with_ai(
                    user_skills=request.user_skills,
                    target_role=target_role,
                    resources=resources,
                    user_profile=user_profile
                )
            except Exception as ai_error:
                logger.warning(f"AI analysis failed, using fallback: {ai_error}")
                analysis = analyze_gap_fallback(
                    user_skills=request.user_skills,
                    required_skills=target_role.get("required_skills", []),
                    nice_to_have_skills=target_role.get("nice_to_have_skills", []),
                    resources=resources,
                    user_profile=user_profile,
                    target_role=target_role
                )

        # Build experience match
        experience_match = None
        if analysis.get("experience_match"):
            exp = analysis["experience_match"]
            experience_match = ExperienceMatch(
                education_match=exp.get("education_match", False),
                education_details=exp.get("education_details"),
                experience_match=exp.get("experience_match", False),
                experience_details=exp.get("experience_details"),
                certifications_match=exp.get("certifications_match", False),
                certifications_details=exp.get("certifications_details"),
                projects_relevance=exp.get("projects_relevance")
            )

        # Add level qualification evaluation
        if user_profile and target_role.get("experience_level"):
            level_qual_data = evaluate_level_qualification(
                user_profile=user_profile,
                target_level=target_role.get("experience_level"),
                required_years=0
            )
            level_qual = LevelQualification(**level_qual_data)
            if experience_match:
                experience_match.level_qualification = level_qual
            else:
                experience_match = ExperienceMatch(level_qualification=level_qual)

        analysis_response = AnalysisResponse(
            matching_skills=analysis.get("matching_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            match_percentage=analysis.get("match_percentage", 0),
            recommendations=analysis.get("recommendations", []),
            estimated_time=analysis.get("estimated_time"),
            profile_summary=analysis.get("profile_summary"),
            experience_match=experience_match,
            ai_generated=analysis.get("ai_generated", False),
            created_at=datetime.utcnow()
        )

        return DescriptionAnalysisResponse(
            parsed_job=ParsedJobInfo(
                title=parsed_job.get("title") or "Software Engineer",
                company=parsed_job.get("company"),
                required_skills=parsed_job.get("required_skills") or [],
                nice_to_have_skills=parsed_job.get("nice_to_have_skills") or [],
                experience_level=parsed_job.get("experience_level"),
                responsibilities=parsed_job.get("responsibilities") or [],
                minimum_qualifications=parsed_job.get("minimum_qualifications") or [],
                description=parsed_job.get("description")
            ),
            analysis=analysis_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Description analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class InterviewQuestion(BaseModel):
    category: str
    question: str
    difficulty: str
    tips: Optional[str] = None


class InterviewQuestionsRequest(BaseModel):
    job_posting_id: Optional[str] = None
    # Allow passing job info directly (for saved analyses that don't have a job_posting_id)
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    job_required_skills: list[str] = Field(default_factory=list)
    job_responsibilities: list[str] = Field(default_factory=list)
    skills_to_focus: list[str] = Field(default_factory=list)


class InterviewQuestionsResponse(BaseModel):
    questions: list[InterviewQuestion]


@router.post("/interview-questions", response_model=InterviewQuestionsResponse)
async def get_interview_questions(
    request: InterviewQuestionsRequest,
    db: Client = Depends(get_db)
):
    """Generate mock interview questions for a job posting."""
    try:
        job_title = request.job_title
        job_company = request.job_company
        required_skills = request.job_required_skills
        responsibilities = request.job_responsibilities

        # If job_posting_id is provided, fetch from database
        if request.job_posting_id:
            posting_result = db.table("job_postings").select("*").eq("id", request.job_posting_id).execute()
            if posting_result.data:
                job_posting = posting_result.data[0]
                job_title = job_posting.get("title", job_title)
                job_company = job_posting.get("company", job_company)
                required_skills = job_posting.get("required_skills", required_skills) or required_skills
                responsibilities = job_posting.get("responsibilities", responsibilities) or responsibilities

        # Validate we have enough info to generate questions
        if not job_title:
            raise HTTPException(status_code=400, detail="Job title is required")

        # Generate questions using AI
        questions = await generate_interview_questions(
            job_title=job_title,
            company=job_company or "",
            required_skills=required_skills or [],
            responsibilities=responsibilities or [],
            skills_to_focus=request.skills_to_focus
        )

        return InterviewQuestionsResponse(questions=questions)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview questions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from supabase import Client
from app.models.job_posting import JobPosting, JobPostingListParams, INDUSTRIES, COMPANIES
from app.services.supabase_client import get_db

router = APIRouter()


@router.get("", response_model=list[JobPosting])
async def get_job_postings(
    search: Optional[str] = Query(None, description="Search by title or description"),
    company: Optional[str] = Query(None, description="Filter by company"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    industries: Optional[str] = Query(None, description="Comma-separated list of industries"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db)
):
    """Get all job postings with optional filters."""
    try:
        query = db.table("job_postings").select("*")

        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%,company.ilike.%{search}%")

        if company:
            query = query.eq("company", company)

        if industry:
            query = query.eq("industry", industry)

        if experience_level:
            query = query.eq("experience_level", experience_level)

        # Filter by multiple industries (comma-separated)
        if industries:
            industry_list = [i.strip() for i in industries.split(",")]
            query = query.in_("industry", industry_list)

        query = query.range(offset, offset + limit - 1)

        result = query.execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/industries")
async def get_industries():
    """Get all available industries."""
    return {"industries": INDUSTRIES}


@router.get("/companies")
async def get_companies():
    """Get all available companies."""
    return {"companies": COMPANIES}


@router.get("/{posting_id}", response_model=JobPosting)
async def get_job_posting(posting_id: str, db: Client = Depends(get_db)):
    """Get a specific job posting by ID."""
    try:
        result = db.table("job_postings").select("*").eq("id", posting_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job posting not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggested/{user_id}")
async def get_suggested_postings(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Client = Depends(get_db)
):
    """Get job postings suggested based on user's target industries."""
    try:
        # Get user profile
        profile_result = db.table("user_profiles").select("target_industries").eq("user_id", user_id).execute()

        if not profile_result.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        target_industries = profile_result.data[0].get("target_industries", [])

        if not target_industries:
            # Return all postings if no industries selected
            result = db.table("job_postings").select("*").limit(limit).execute()
        else:
            # Filter by target industries
            result = db.table("job_postings").select("*").in_("industry", target_industries).limit(limit).execute()

        return result.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

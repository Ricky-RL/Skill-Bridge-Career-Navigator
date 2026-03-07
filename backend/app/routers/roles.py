from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from supabase import Client
from app.models.role import JobRole
from app.services.supabase_client import get_db

router = APIRouter()


@router.get("", response_model=list[JobRole])
async def list_roles(
    search: Optional[str] = Query(None, description="Search by title"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db)
):
    """List all job roles with optional search and filter."""
    try:
        query = db.table("job_roles").select("*")

        if search:
            query = query.ilike("title", f"%{search}%")

        if category:
            query = query.eq("category", category)

        query = query.range(offset, offset + limit - 1)
        result = query.execute()

        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def list_categories(db: Client = Depends(get_db)):
    """Get list of unique job role categories."""
    try:
        result = db.table("job_roles").select("category").execute()
        categories = list(set(r["category"] for r in result.data if r.get("category")))
        return {"categories": sorted(categories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{role_id}", response_model=JobRole)
async def get_role(role_id: str, db: Client = Depends(get_db)):
    """Get a specific job role by ID."""
    try:
        result = db.table("job_roles").select("*").eq("id", role_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Role not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

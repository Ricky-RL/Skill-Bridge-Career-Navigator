from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
import logging
from typing import Optional

from ..services.supabase_client import get_db
from ..models.saved_analysis import (
    SavedAnalysisCreate,
    SavedAnalysisResponse,
    SavedAnalysisListItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/saved-analyses", tags=["saved-analyses"])


@router.post("", response_model=SavedAnalysisResponse)
async def save_analysis(request: SavedAnalysisCreate, db: Client = Depends(get_db)):
    """Save an analysis result for later viewing"""
    try:
        # Prepare data for insertion
        data = {
            "user_id": request.user_id,
            "job_info": request.job_info.model_dump(),
            "analysis_result": request.analysis_result,
            "job_description": request.job_description,
        }

        result = db.table("saved_analyses").insert(data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save analysis")

        saved = result.data[0]
        return SavedAnalysisResponse(
            id=saved["id"],
            user_id=saved["user_id"],
            job_info=saved["job_info"],
            analysis_result=saved["analysis_result"],
            job_description=saved.get("job_description"),
            created_at=saved["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[SavedAnalysisListItem])
async def list_saved_analyses(
    user_id: str,
    limit: int = 50,
    db: Client = Depends(get_db),
):
    """Get all saved analyses for a user"""
    try:
        result = (
            db.table("saved_analyses")
            .select("id, job_info, analysis_result, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        items = []
        for row in result.data:
            job_info = row.get("job_info", {})
            analysis_result = row.get("analysis_result", {})
            items.append(
                SavedAnalysisListItem(
                    id=row["id"],
                    job_title=job_info.get("title", "Unknown Role"),
                    company=job_info.get("company"),
                    match_percentage=analysis_result.get("match_percentage", 0),
                    created_at=row["created_at"],
                )
            )

        return items

    except Exception as e:
        logger.error(f"Error listing saved analyses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{analysis_id}", response_model=SavedAnalysisResponse)
async def get_saved_analysis(
    analysis_id: str,
    user_id: str,
    db: Client = Depends(get_db),
):
    """Get a specific saved analysis"""
    try:
        result = (
            db.table("saved_analyses")
            .select("*")
            .eq("id", analysis_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved analysis not found")

        saved = result.data[0]
        return SavedAnalysisResponse(
            id=saved["id"],
            user_id=saved["user_id"],
            job_info=saved["job_info"],
            analysis_result=saved["analysis_result"],
            job_description=saved.get("job_description"),
            created_at=saved["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting saved analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{analysis_id}")
async def delete_saved_analysis(
    analysis_id: str,
    user_id: str,
    db: Client = Depends(get_db),
):
    """Delete a saved analysis"""
    try:
        # First verify the analysis belongs to the user
        check = (
            db.table("saved_analyses")
            .select("id")
            .eq("id", analysis_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not check.data:
            raise HTTPException(status_code=404, detail="Saved analysis not found")

        # Delete the analysis
        db.table("saved_analyses").delete().eq("id", analysis_id).execute()

        return {"message": "Analysis deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

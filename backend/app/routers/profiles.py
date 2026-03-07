from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from supabase import Client
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.supabase_client import get_db
from datetime import datetime

router = APIRouter()


@router.post("", response_model=ProfileResponse)
async def create_profile(profile: ProfileCreate, db: Client = Depends(get_db)):
    """Create a new user profile."""
    try:
        data = {
            "user_id": profile.user_id,
            "name": profile.name,
            "job_title": profile.job_title,
            "skills": profile.skills,
            "target_role_id": profile.target_role_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = db.table("user_profiles").insert(data).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create profile")

        return result.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=409, detail="Profile already exists for this user")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str, db: Client = Depends(get_db)):
    """Get a user profile by user ID."""
    try:
        result = db.table("user_profiles").select("*").eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}", response_model=ProfileResponse)
async def update_profile(user_id: str, profile: ProfileUpdate, db: Client = Depends(get_db)):
    """Update a user profile."""
    try:
        # Build update data excluding None values
        update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = db.table("user_profiles").update(update_data).eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}")
async def delete_profile(user_id: str, db: Client = Depends(get_db)):
    """Delete a user profile."""
    try:
        result = db.table("user_profiles").delete().eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {"message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
from supabase import Client
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.supabase_client import get_db
from app.services.resume_parser import extract_text_from_pdf, extract_skills_from_resume
from datetime import datetime
import uuid

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
            "target_industries": profile.target_industries,
            "target_role_id": profile.target_role_id,
            "resume_url": profile.resume_url,
            "resume_text": profile.resume_text,
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


@router.post("/upload-resume")
async def upload_resume(
    user_id: str,
    file: UploadFile = File(...),
    db: Client = Depends(get_db)
):
    """Upload a resume PDF and extract text/skills from it."""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    if file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    try:
        # Read file content
        content = await file.read()

        # Extract text from PDF
        resume_text = extract_text_from_pdf(content)

        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. Please ensure it's not a scanned image.")

        # Upload to Supabase Storage
        file_name = f"{user_id}/{uuid.uuid4()}.pdf"

        # Upload file to storage bucket
        storage_result = db.storage.from_("resumes").upload(
            file_name,
            content,
            {"content-type": "application/pdf"}
        )

        # Get public URL
        resume_url = db.storage.from_("resumes").get_public_url(file_name)

        # Extract skills using AI
        extracted_skills = await extract_skills_from_resume(resume_text)

        return {
            "resume_url": resume_url,
            "resume_text": resume_text[:5000],  # Limit stored text
            "extracted_skills": extracted_skills,
            "message": "Resume uploaded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import profiles, roles, analyze, job_postings, saved_analyses

settings = get_settings()

app = FastAPI(
    title="Skill-Bridge Career Navigator API",
    description="API for analyzing skill gaps and providing learning roadmaps",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(job_postings.router, prefix="/api/job-postings", tags=["job-postings"])
app.include_router(saved_analyses.router)


@app.get("/")
async def root():
    return {"message": "Skill-Bridge Career Navigator API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

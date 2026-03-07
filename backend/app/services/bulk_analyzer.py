"""Bulk job analysis service for comparing user against multiple jobs."""

from collections import defaultdict
from app.services.fallback_analyzer import analyze_gap_fallback


def analyze_bulk_jobs(
    user_skills: list[str],
    job_postings: list[dict],
    resources: list[dict] = None,
    user_profile: dict = None
) -> dict:
    """
    Analyze user against multiple jobs using rule-based fallback.

    Uses the fallback analyzer for ALL individual analyses to ensure
    fast, free processing (no AI API calls).

    Args:
        user_skills: List of user's current skills
        job_postings: List of job posting dictionaries
        resources: Optional learning resources
        user_profile: Optional full user profile

    Returns:
        Aggregated analysis with market readiness score, skill frequencies, and job matches
    """
    if resources is None:
        resources = []

    results = []
    skill_counts = defaultdict(int)
    missing_skill_counts = defaultdict(int)
    industry_matches = defaultdict(list)

    for job in job_postings:
        # Use rule-based fallback - fast and free (no API calls)
        analysis = analyze_gap_fallback(
            user_skills=user_skills,
            required_skills=job.get("required_skills", []),
            nice_to_have_skills=job.get("preferred_skills", []),
            resources=resources,
            user_profile=user_profile,
            target_role=job
        )

        # Track skill frequencies across all jobs
        for skill in job.get("required_skills", []):
            skill_counts[skill] += 1

        # Track which skills user is missing across jobs
        for skill in analysis.get("missing_skills", []):
            missing_skill_counts[skill] += 1

        job_result = {
            "job_id": job.get("id", "unknown"),
            "title": job.get("title", "Unknown"),
            "company": job.get("company", "Unknown"),
            "industry": job.get("industry", "Unknown"),
            "experience_level": job.get("experience_level", "Unknown"),
            "match_percentage": analysis["match_percentage"],
            "matching_skills": analysis["matching_skills"],
            "missing_skills": analysis["missing_skills"]
        }
        results.append(job_result)

        # Track match percentages by industry
        industry = job.get("industry", "Unknown")
        industry_matches[industry].append(analysis["match_percentage"])

    # Calculate aggregated metrics
    total_jobs = len(results)
    avg_match = sum(r["match_percentage"] for r in results) / total_jobs if total_jobs else 0

    return {
        "total_jobs_analyzed": total_jobs,
        "market_readiness_score": _calculate_market_readiness(results, skill_counts, user_skills),
        "most_requested_skills": _get_skill_frequencies(skill_counts, user_skills, total_jobs, limit=10),
        "most_missing_skills": _get_missing_skill_frequencies(missing_skill_counts, user_skills, total_jobs, limit=10),
        "job_matches": sorted(results, key=lambda x: x["match_percentage"], reverse=True),
        "avg_match_percentage": round(avg_match, 1),
        "best_fit_industries": _get_best_industries(industry_matches)
    }


def _calculate_market_readiness(results: list, skill_counts: dict, user_skills: list[str]) -> int:
    """
    Calculate market readiness score (0-100).

    Formula:
    - 60% weight: Average match percentage across all jobs
    - 25% weight: Coverage of high-demand skills (skills in >50% of jobs)
    - 15% weight: Number of strong matches (>70% match)
    """
    if not results:
        return 0

    total_jobs = len(results)

    # Component 1: Average match percentage (60%)
    avg_match = sum(r["match_percentage"] for r in results) / total_jobs

    # Component 2: High-demand skill coverage (25%)
    user_skills_lower = [s.lower() for s in user_skills]
    high_demand_skills = [s for s, count in skill_counts.items()
                         if count / total_jobs >= 0.5]

    if high_demand_skills:
        covered = sum(1 for s in high_demand_skills
                     if any(s.lower() in u or u in s.lower() for u in user_skills_lower))
        high_demand_pct = (covered / len(high_demand_skills)) * 100
    else:
        high_demand_pct = 100  # No high-demand skills to cover

    # Component 3: Strong match ratio (15%)
    strong_matches = sum(1 for r in results if r["match_percentage"] >= 70)
    strong_match_pct = (strong_matches / total_jobs) * 100

    # Weighted score
    score = int(avg_match * 0.6 + high_demand_pct * 0.25 + strong_match_pct * 0.15)
    return min(100, max(0, score))


def _get_skill_frequencies(
    skill_counts: dict,
    user_skills: list[str],
    total_jobs: int,
    limit: int = 10
) -> list[dict]:
    """Get most requested skills with user coverage info."""
    user_skills_lower = [s.lower() for s in user_skills]

    results = []
    for skill, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:limit]:
        user_has = any(skill.lower() in u or u in skill.lower() for u in user_skills_lower)
        results.append({
            "skill": skill,
            "frequency": count,
            "percentage": round((count / total_jobs) * 100, 1) if total_jobs > 0 else 0,
            "user_has": user_has
        })
    return results


def _get_missing_skill_frequencies(
    missing_counts: dict,
    user_skills: list[str],
    total_jobs: int,
    limit: int = 10
) -> list[dict]:
    """Get most frequently missing skills."""
    results = []
    for skill, count in sorted(missing_counts.items(), key=lambda x: x[1], reverse=True)[:limit]:
        results.append({
            "skill": skill,
            "frequency": count,
            "percentage": round((count / total_jobs) * 100, 1) if total_jobs > 0 else 0,
            "user_has": False  # These are all missing by definition
        })
    return results


def _get_best_industries(industry_matches: dict, limit: int = 3) -> list[str]:
    """Get industries where user has highest average match."""
    if not industry_matches:
        return []

    industry_avgs = []
    for industry, matches in industry_matches.items():
        if matches:
            avg = sum(matches) / len(matches)
            industry_avgs.append((industry, avg))

    # Sort by average match, descending
    industry_avgs.sort(key=lambda x: x[1], reverse=True)

    return [industry for industry, _ in industry_avgs[:limit]]

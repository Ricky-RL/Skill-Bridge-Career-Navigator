"""Rule-based fallback analyzer for when AI is unavailable."""

from typing import Optional


def analyze_gap_fallback(
    user_skills: list[str],
    required_skills: list[str],
    nice_to_have_skills: list[str] = None,
    resources: list[dict] = None
) -> dict:
    """
    Analyze skill gap using rule-based matching.

    This fallback is used when AI analysis is unavailable or fails.
    """
    if nice_to_have_skills is None:
        nice_to_have_skills = []
    if resources is None:
        resources = []

    # Normalize skills for comparison
    normalized_user = [s.lower().strip() for s in user_skills]
    normalized_required = [s.lower().strip() for s in required_skills]

    matching = []
    missing = []

    for skill in required_skills:
        skill_lower = skill.lower().strip()
        # Check for exact or partial match
        if any(skill_lower in u or u in skill_lower for u in normalized_user):
            matching.append(skill)
        else:
            missing.append(skill)

    # Calculate match percentage
    total_required = len(normalized_required)
    match_percentage = round((len(matching) / total_required) * 100) if total_required > 0 else 0

    # Generate recommendations based on missing skills
    recommendations = []
    for i, skill in enumerate(missing):
        # Find matching resources for this skill
        skill_resources = [
            r for r in resources
            if r.get("skill_name", "").lower() == skill.lower()
        ]

        recommendations.append({
            "skill": skill,
            "priority": i + 1,
            "resources": skill_resources[:3]  # Limit to 3 resources per skill
        })

    # Estimate time based on number of missing skills
    if len(missing) == 0:
        estimated_time = "You're ready!"
    elif len(missing) <= 2:
        estimated_time = "1-2 months"
    elif len(missing) <= 5:
        estimated_time = "3-6 months"
    else:
        estimated_time = "6-12 months"

    return {
        "matching_skills": matching,
        "missing_skills": missing,
        "match_percentage": match_percentage,
        "recommendations": recommendations,
        "estimated_time": estimated_time,
        "ai_generated": False
    }

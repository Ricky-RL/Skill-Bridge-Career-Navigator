"""Rule-based fallback analyzer for when AI is unavailable."""

from typing import Optional


def analyze_gap_fallback(
    user_skills: list[str],
    required_skills: list[str],
    nice_to_have_skills: list[str] = None,
    resources: list[dict] = None,
    user_profile: dict = None,
    target_role: dict = None
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

    # Calculate base match percentage from skills
    total_required = len(normalized_required)
    skill_match = round((len(matching) / total_required) * 100) if total_required > 0 else 0

    # Build experience match info if profile is available
    experience_match = None
    profile_summary = None

    if user_profile:
        experience_match = _analyze_experience_match(user_profile, target_role)
        profile_summary = _generate_fallback_summary(user_profile, target_role, matching, missing)

        # Adjust match percentage based on experience (basic heuristic)
        experience_bonus = 0
        if experience_match.get("education_match"):
            experience_bonus += 5
        if experience_match.get("experience_match"):
            experience_bonus += 10
        if experience_match.get("certifications_match"):
            experience_bonus += 5

        skill_match = min(100, skill_match + experience_bonus)

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
        "match_percentage": skill_match,
        "recommendations": recommendations,
        "estimated_time": estimated_time,
        "profile_summary": profile_summary,
        "experience_match": experience_match,
        "ai_generated": False
    }


def _analyze_experience_match(user_profile: dict, target_role: dict = None) -> dict:
    """Analyze how well user's experience matches the role requirements."""
    result = {
        "education_match": False,
        "education_details": "No education information available",
        "experience_match": False,
        "experience_details": "No work experience information available",
        "certifications_match": False,
        "certifications_details": "No certifications found",
        "projects_relevance": "No projects information available"
    }

    # Check education
    education = user_profile.get("education", [])
    if education:
        degrees = [e.get("degree", "").lower() for e in education]
        fields = [e.get("field_of_study", "").lower() for e in education]

        # Check for relevant degrees
        tech_fields = ["computer", "software", "engineering", "data", "information", "math", "science"]
        has_relevant_degree = any(
            any(field in f for field in tech_fields)
            for f in fields
        )

        if has_relevant_degree:
            result["education_match"] = True
            result["education_details"] = f"Has relevant technical education ({education[0].get('degree', 'Degree')} in {education[0].get('field_of_study', 'tech field')})"
        else:
            result["education_details"] = "Education may not directly align with technical requirements"

    # Check work experience
    work_exp = user_profile.get("work_experience", [])
    if work_exp:
        years = user_profile.get("years_of_experience", len(work_exp))
        recent_titles = [e.get("title", "").lower() for e in work_exp[:2]]

        tech_titles = ["engineer", "developer", "programmer", "analyst", "architect", "devops", "sre"]
        has_tech_exp = any(
            any(title in t for title in tech_titles)
            for t in recent_titles
        )

        if has_tech_exp:
            result["experience_match"] = True
            result["experience_details"] = f"{years} years of relevant technical experience"
        else:
            result["experience_details"] = f"Has {years} years of work experience, may need to highlight technical aspects"

    # Check certifications
    certs = user_profile.get("certifications", [])
    if certs:
        cert_names = [c.get("name", "").lower() for c in certs]
        tech_certs = ["aws", "azure", "gcp", "kubernetes", "docker", "security", "cloud", "professional"]

        has_tech_cert = any(
            any(cert in c for cert in tech_certs)
            for c in cert_names
        )

        if has_tech_cert:
            result["certifications_match"] = True
            result["certifications_details"] = f"Has {len(certs)} relevant certification(s)"
        else:
            result["certifications_details"] = f"Has {len(certs)} certification(s), consider adding industry certifications"

    # Check projects
    projects = user_profile.get("projects", [])
    if projects:
        all_tech = []
        for p in projects:
            all_tech.extend(p.get("technologies", []))

        if all_tech:
            result["projects_relevance"] = f"Has {len(projects)} project(s) using technologies like {', '.join(all_tech[:5])}"
        else:
            result["projects_relevance"] = f"Has {len(projects)} project(s) to showcase practical skills"

    return result


def _generate_fallback_summary(
    user_profile: dict,
    target_role: dict,
    matching: list[str],
    missing: list[str]
) -> str:
    """Generate a basic profile summary without AI."""
    parts = []

    # Opening based on match count
    match_ratio = len(matching) / (len(matching) + len(missing)) if (matching or missing) else 0

    if match_ratio >= 0.7:
        parts.append("Strong candidate with most required skills.")
    elif match_ratio >= 0.4:
        parts.append("Promising candidate with some skill gaps to address.")
    else:
        parts.append("Candidate shows potential but needs significant skill development.")

    # Mention experience if available
    years = user_profile.get("years_of_experience")
    if years:
        parts.append(f"Has {years} years of experience.")

    # Mention education if available
    education = user_profile.get("education", [])
    if education and education[0].get("degree"):
        edu = education[0]
        parts.append(f"Educational background: {edu.get('degree')} in {edu.get('field_of_study', 'relevant field')}.")

    # Key gap
    if missing:
        parts.append(f"Priority skills to develop: {', '.join(missing[:3])}.")

    return " ".join(parts)

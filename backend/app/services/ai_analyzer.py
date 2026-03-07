"""AI-powered skill gap analyzer using Groq."""

import json
from groq import Groq
from app.config import get_settings


# Experience level hierarchy for comparison
EXPERIENCE_LEVELS = {
    "Entry Level": {"min_years": 0, "max_years": 2, "rank": 1},
    "Mid": {"min_years": 2, "max_years": 5, "rank": 2},
    "Senior": {"min_years": 5, "max_years": 8, "rank": 3},
    "Staff": {"min_years": 8, "max_years": 12, "rank": 4},
    "Principal": {"min_years": 12, "max_years": 20, "rank": 5},
    "Management": {"min_years": 5, "max_years": 20, "rank": 3},  # Can vary
}


def calculate_user_experience_level(years_of_experience: int, work_experience: list) -> str:
    """Determine user's experience level based on years and work history."""
    if years_of_experience is None:
        # Try to calculate from work experience
        if work_experience:
            total_years = 0
            for exp in work_experience:
                start = exp.get('start_date', '')
                end = exp.get('end_date', '') or '2026'
                try:
                    start_year = int(start[:4]) if start else 0
                    end_year = int(end[:4]) if end else 2026
                    total_years += max(0, end_year - start_year)
                except (ValueError, TypeError):
                    pass
            years_of_experience = min(total_years, 20)  # Cap at 20
        else:
            years_of_experience = 0

    if years_of_experience < 2:
        return "Entry Level"
    elif years_of_experience < 5:
        return "Mid"
    elif years_of_experience < 8:
        return "Senior"
    elif years_of_experience < 12:
        return "Staff"
    else:
        return "Principal"


def evaluate_level_qualification(user_profile: dict, target_level: str, required_years: int) -> dict:
    """Evaluate if user is qualified for the target experience level."""
    years_of_experience = user_profile.get('years_of_experience', 0) or 0
    work_experience = user_profile.get('work_experience', [])

    user_level = calculate_user_experience_level(years_of_experience, work_experience)

    target_info = EXPERIENCE_LEVELS.get(target_level, EXPERIENCE_LEVELS["Mid"])
    user_info = EXPERIENCE_LEVELS.get(user_level, EXPERIENCE_LEVELS["Entry Level"])

    # Calculate years gap
    years_gap = target_info["min_years"] - years_of_experience if years_of_experience < target_info["min_years"] else 0

    # Determine if qualified
    qualified = user_info["rank"] >= target_info["rank"] or years_of_experience >= target_info["min_years"]

    # Generate details
    if qualified:
        if user_info["rank"] > target_info["rank"]:
            details = f"You're overqualified for this role. With {years_of_experience} years of experience, you may want to target more senior positions."
        else:
            details = f"Your experience level ({user_level}, {years_of_experience} years) aligns well with the {target_level} requirements."
    else:
        details = f"This role requires {target_level} experience ({target_info['min_years']}+ years). You have {years_of_experience} years. Consider gaining {years_gap} more years of experience or targeting {user_level} positions."

    return {
        "qualified": qualified,
        "user_level": user_level,
        "target_level": target_level,
        "years_gap": years_gap if years_gap > 0 else None,
        "details": details
    }


async def analyze_gap_with_ai(
    user_skills: list[str],
    target_role: dict,
    resources: list[dict] = None,
    user_profile: dict = None
) -> dict:
    """
    Analyze skill gap and profile fit using Groq AI.

    Args:
        user_skills: List of user's current skills
        target_role: Target job role/posting with required_skills
        resources: Available learning resources
        user_profile: Full user profile including education, experience, etc.

    Returns:
        Analysis result with matching/missing skills, recommendations, and profile summary
    """
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    required_skills = target_role.get("required_skills", [])
    nice_to_have = target_role.get("nice_to_have_skills", [])

    # Build resource context
    resource_context = ""
    if resources:
        resource_context = "\n\nAvailable learning resources:\n"
        for r in resources[:20]:  # Limit context size
            resource_context += f"- {r.get('resource_name', 'Unknown')} ({r.get('platform', 'Unknown')}): teaches {r.get('skill_name', 'Unknown')}\n"

    # Build comprehensive profile context
    profile_context = ""
    if user_profile:
        profile_context = "\n\n--- CANDIDATE PROFILE ---\n"

        if user_profile.get("name"):
            profile_context += f"Name: {user_profile.get('name')}\n"

        if user_profile.get("job_title"):
            profile_context += f"Current Role: {user_profile.get('job_title')}\n"

        if user_profile.get("years_of_experience"):
            profile_context += f"Years of Experience: {user_profile.get('years_of_experience')}\n"

        # Education
        education = user_profile.get("education", [])
        if education:
            profile_context += "\nEducation:\n"
            for edu in education:
                profile_context += f"  - {edu.get('degree', 'Degree')} in {edu.get('field_of_study', 'N/A')} from {edu.get('institution', 'Unknown')}"
                if edu.get('gpa'):
                    profile_context += f" (GPA: {edu.get('gpa')})"
                if edu.get('end_date'):
                    profile_context += f" - {edu.get('end_date')}"
                profile_context += "\n"

        # Work Experience
        work_exp = user_profile.get("work_experience", [])
        if work_exp:
            profile_context += "\nWork Experience:\n"
            for exp in work_exp:
                profile_context += f"  - {exp.get('title', 'Role')} at {exp.get('company', 'Company')}"
                if exp.get('start_date') and exp.get('end_date'):
                    profile_context += f" ({exp.get('start_date')} - {exp.get('end_date')})"
                profile_context += "\n"
                if exp.get('description'):
                    profile_context += f"    {exp.get('description')[:200]}\n"
                if exp.get('highlights'):
                    for h in exp.get('highlights', [])[:3]:
                        profile_context += f"    • {h}\n"

        # Certifications
        certs = user_profile.get("certifications", [])
        if certs:
            profile_context += "\nCertifications:\n"
            for cert in certs:
                profile_context += f"  - {cert.get('name', 'Certification')}"
                if cert.get('issuer'):
                    profile_context += f" ({cert.get('issuer')})"
                profile_context += "\n"

        # Projects
        projects = user_profile.get("projects", [])
        if projects:
            profile_context += "\nProjects:\n"
            for proj in projects:
                profile_context += f"  - {proj.get('name', 'Project')}"
                if proj.get('technologies'):
                    profile_context += f" [{', '.join(proj.get('technologies', [])[:5])}]"
                profile_context += "\n"
                if proj.get('description'):
                    profile_context += f"    {proj.get('description')[:150]}\n"

    # Build job posting context
    job_context = f"""
--- JOB POSTING ---
Title: {target_role.get('title', 'Unknown')}
Company: {target_role.get('company', 'Unknown')}
Experience Level: {target_role.get('experience_level', 'Not specified')}

Required Skills: {', '.join(required_skills)}
Nice to Have Skills: {', '.join(nice_to_have)}
"""

    if target_role.get('minimum_qualifications'):
        job_context += f"\nMinimum Qualifications:\n"
        for qual in target_role.get('minimum_qualifications', [])[:5]:
            job_context += f"  - {qual}\n"

    if target_role.get('preferred_qualifications'):
        job_context += f"\nPreferred Qualifications:\n"
        for qual in target_role.get('preferred_qualifications', [])[:5]:
            job_context += f"  - {qual}\n"

    if target_role.get('responsibilities'):
        job_context += f"\nKey Responsibilities:\n"
        for resp in target_role.get('responsibilities', [])[:5]:
            job_context += f"  - {resp}\n"

    prompt = f"""Perform a comprehensive analysis comparing a candidate's profile against a job posting.

{job_context}
{profile_context}

User's Listed Skills: {', '.join(user_skills)}
{resource_context}

Provide a JSON response with exactly this structure:
{{
    "matching_skills": ["list of skills the user already has that match required skills"],
    "missing_skills": ["list of required skills the user is missing"],
    "match_percentage": <integer 0-100 - consider skills (60%), experience relevance (25%), and education fit (15%)>,
    "profile_summary": "<A concise 2-3 sentence summary (under 150 words) that highlights key strengths and gaps. Mention specific relevant experience, education alignment, and the most critical skills to develop. Be encouraging but honest.>",
    "experience_match": {{
        "education_match": <true/false - does their education align with job requirements?>,
        "education_details": "<brief note about education fit>",
        "experience_match": <true/false - does their work experience align?>,
        "experience_details": "<brief note about experience relevance>",
        "certifications_match": <true/false - do they have relevant certifications?>,
        "certifications_details": "<brief note about certifications>",
        "projects_relevance": "<brief note about how their projects relate to the role>"
    }},
    "recommendations": [
        {{
            "skill": "skill name",
            "priority": <integer 1-N, 1 being highest priority>,
            "resources": [
                {{
                    "name": "resource name",
                    "platform": "platform name",
                    "url": "url if known or empty string"
                }}
            ]
        }}
    ],
    "estimated_time": "estimated time to close the skill gap (e.g., '3-6 months')"
}}

Important guidelines for profile_summary:
- Be specific about what makes them a good or challenging fit
- Reference actual experience, projects, or education from their profile
- Identify 1-2 key strengths and 1-2 areas for growth
- Keep it under 150 words and make it actionable
- Avoid generic phrases - be specific to this candidate and role"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=2500
    )

    result = json.loads(response.choices[0].message.content)
    result["ai_generated"] = True

    return result


async def parse_job_description(job_description: str) -> dict:
    """
    Parse a raw job description text to extract structured job information.

    Args:
        job_description: Raw job description text

    Returns:
        Dictionary with parsed job details (title, company, skills, etc.)
    """
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    prompt = f"""Parse the following job description and extract structured information.

--- JOB DESCRIPTION ---
{job_description}
--- END ---

Return a JSON object with this exact structure:
{{
    "title": "The job title (e.g., 'Senior Software Engineer')",
    "company": "Company name if mentioned, or null",
    "experience_level": "Entry Level" | "Mid" | "Senior" | "Staff" | "Principal" | "Management" | null,
    "required_skills": ["List of required technical skills (programming languages, frameworks, tools)"],
    "nice_to_have_skills": ["List of preferred/nice-to-have skills"],
    "responsibilities": ["List of key job responsibilities"],
    "minimum_qualifications": ["List of minimum qualifications (education, years of experience, etc.)"],
    "preferred_qualifications": ["List of preferred qualifications"],
    "description": "Brief 2-3 sentence summary of the role"
}}

Guidelines:
- Extract specific technical skills (Python, React, AWS, etc.)
- Infer experience_level from years of experience mentioned or seniority in title
- Keep skill lists concise (max 10 required, 5 nice-to-have)
- If something isn't mentioned, use an empty list or null"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1500
    )

    return json.loads(response.choices[0].message.content)


async def generate_interview_questions(
    job_title: str,
    company: str,
    required_skills: list[str],
    responsibilities: list[str],
    skills_to_focus: list[str] = None
) -> list[dict]:
    """
    Generate mock interview questions for a job posting using AI.

    Args:
        job_title: The job title
        company: The company name
        required_skills: Skills required for the role
        responsibilities: Job responsibilities
        skills_to_focus: Specific skills to emphasize (e.g., skills the user is missing)

    Returns:
        List of interview questions with category, difficulty, and tips
    """
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    focus_skills = skills_to_focus or required_skills[:5]

    prompt = f"""Generate comprehensive mock interview questions for the following role:

Job Title: {job_title}
Company: {company}
Required Skills: {', '.join(required_skills[:10])}
Key Responsibilities: {'; '.join(responsibilities[:5])}
Skills to Focus On: {', '.join(focus_skills[:5])}

Generate 12-15 interview questions covering these categories:
1. Technical Questions (about the required skills)
2. Behavioral Questions (STAR method style)
3. System Design / Problem Solving (if applicable)
4. Company/Role Fit

Return a JSON object with this exact structure:
{{
    "questions": [
        {{
            "category": "Technical" | "Behavioral" | "System Design" | "Role Fit",
            "question": "The interview question",
            "difficulty": "easy" | "medium" | "hard",
            "tips": "Brief tips on how to approach answering this question"
        }}
    ]
}}

Guidelines:
- Include 4-5 technical questions about specific skills
- Include 3-4 behavioral questions (teamwork, conflict, failure, leadership)
- Include 2-3 system design or problem-solving questions
- Include 2-3 role/company fit questions
- Make questions specific to the role and company
- Provide actionable tips for each question
- Vary difficulty levels appropriately"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.5,
        max_tokens=3000
    )

    result = json.loads(response.choices[0].message.content)
    return result.get("questions", [])

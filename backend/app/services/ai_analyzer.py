"""AI-powered skill gap analyzer using Groq."""

import json
from groq import Groq
from app.config import get_settings


async def analyze_gap_with_ai(
    user_skills: list[str],
    target_role: dict,
    resources: list[dict] = None
) -> dict:
    """
    Analyze skill gap using Groq AI.

    Args:
        user_skills: List of user's current skills
        target_role: Target job role with required_skills
        resources: Available learning resources

    Returns:
        Analysis result with matching/missing skills and recommendations
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

    prompt = f"""Analyze the skill gap between a user and their target role.

User's Current Skills: {', '.join(user_skills)}

Target Role: {target_role.get('title', 'Unknown')}
Required Skills: {', '.join(required_skills)}
Nice to Have Skills: {', '.join(nice_to_have)}
{resource_context}

Provide a JSON response with exactly this structure:
{{
    "matching_skills": ["list of skills the user already has that match required skills"],
    "missing_skills": ["list of required skills the user is missing"],
    "match_percentage": <integer 0-100 representing how many required skills the user has>,
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

Focus on actionable, specific recommendations. Prioritize the most critical missing skills first."""

    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=2000
    )

    result = json.loads(response.choices[0].message.content)
    result["ai_generated"] = True

    return result

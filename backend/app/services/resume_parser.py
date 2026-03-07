"""Resume parsing utilities for extracting comprehensive profile information."""

import io
import json
from typing import Optional
from groq import Groq
from app.config import get_settings


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        import pypdf
        pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_content))

        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        return "\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


async def extract_profile_from_resume(resume_text: str) -> dict:
    """Use AI to extract comprehensive profile information from resume text."""
    try:
        settings = get_settings()
        client = Groq(api_key=settings.groq_api_key)

        prompt = f"""Analyze the following resume text and extract comprehensive profile information.

Resume:
{resume_text[:6000]}

Return a JSON object with exactly this structure:
{{
    "skills": ["skill1", "skill2", ...],
    "years_of_experience": <number or null>,
    "education": [
        {{
            "institution": "University Name",
            "degree": "Bachelor's/Master's/PhD/etc",
            "field_of_study": "Computer Science/etc",
            "start_date": "2018 or Aug 2018",
            "end_date": "2022 or May 2022 or Present",
            "gpa": "3.8 or null"
        }}
    ],
    "certifications": [
        {{
            "name": "AWS Solutions Architect",
            "issuer": "Amazon Web Services",
            "date_obtained": "2023",
            "expiry_date": "2026 or null",
            "credential_id": "ABC123 or null"
        }}
    ],
    "work_experience": [
        {{
            "company": "Company Name",
            "title": "Software Engineer",
            "start_date": "Jan 2022",
            "end_date": "Present or Dec 2023",
            "description": "Brief role description",
            "highlights": ["Built X that improved Y by Z%", "Led team of N engineers"]
        }}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "What the project does",
            "technologies": ["React", "Node.js", "PostgreSQL"],
            "url": "github.com/user/project or null"
        }}
    ]
}}

Guidelines:
- Extract ALL technical skills mentioned (programming languages, frameworks, tools, cloud platforms, databases, etc.)
- Normalize skill names (e.g., "JavaScript" not "JS", "Python" not "python3")
- Include both bootcamps and traditional education in the education array
- For certifications, include professional certs, course completions, and bootcamp certificates
- For work experience, focus on tech-relevant roles
- For projects, include personal projects, hackathon projects, and significant coursework
- Calculate years_of_experience from work history if possible
- Use null for missing optional fields, don't make up data"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=3000
        )

        result = json.loads(response.choices[0].message.content)

        # Ensure all required fields exist
        return {
            "skills": result.get("skills", []),
            "years_of_experience": result.get("years_of_experience"),
            "education": result.get("education", []),
            "certifications": result.get("certifications", []),
            "work_experience": result.get("work_experience", []),
            "projects": result.get("projects", [])
        }

    except Exception as e:
        # Fallback: extract just skills using keyword matching
        return {
            "skills": extract_skills_fallback(resume_text),
            "years_of_experience": None,
            "education": [],
            "certifications": [],
            "work_experience": [],
            "projects": []
        }


async def extract_skills_from_resume(resume_text: str) -> list[str]:
    """Use AI to extract skills from resume text (legacy function for compatibility)."""
    result = await extract_profile_from_resume(resume_text)
    return result.get("skills", [])


def extract_skills_fallback(resume_text: str) -> list[str]:
    """Fallback skill extraction using keyword matching."""
    known_skills = [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
        "Ruby", "PHP", "Swift", "Kotlin", "SQL", "R", "Scala", "Perl",
        "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django",
        "Flask", "FastAPI", "Spring", "Rails", "Laravel",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
        "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "CircleCI",
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
        "HTML", "CSS", "Tailwind", "Bootstrap", "SASS",
        "REST", "GraphQL", "gRPC", "API",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "pandas", "NumPy", "scikit-learn", "Spark",
        "Linux", "Unix", "Bash", "Shell",
        "Agile", "Scrum", "Kanban", "Jira",
        "Testing", "Jest", "Pytest", "Selenium",
        "Security", "OAuth", "JWT", "OWASP"
    ]

    text_lower = resume_text.lower()
    found_skills = []

    for skill in known_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill)

    return found_skills

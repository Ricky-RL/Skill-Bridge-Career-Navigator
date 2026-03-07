"""Resume parsing utilities for extracting text and skills."""

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


async def extract_skills_from_resume(resume_text: str) -> list[str]:
    """Use AI to extract skills from resume text."""
    try:
        settings = get_settings()
        client = Groq(api_key=settings.groq_api_key)

        prompt = f"""Analyze the following resume text and extract all technical and professional skills mentioned.

Resume:
{resume_text[:4000]}

Return a JSON object with exactly this structure:
{{
    "skills": ["skill1", "skill2", "skill3", ...]
}}

Only include actual skills (programming languages, frameworks, tools, methodologies, soft skills).
Do not include job titles, company names, or dates.
Normalize skill names (e.g., "JavaScript" not "JS", "Python" not "python3")."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1000
        )

        result = json.loads(response.choices[0].message.content)
        return result.get("skills", [])

    except Exception as e:
        # Fallback: extract common skills using keyword matching
        return extract_skills_fallback(resume_text)


def extract_skills_fallback(resume_text: str) -> list[str]:
    """Fallback skill extraction using keyword matching."""
    # Common tech skills to look for
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

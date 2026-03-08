"""
Tests for the resume parser service.
Tests PDF text extraction, skill extraction fallback, and profile parsing.
"""
import pytest
from app.services.resume_parser import extract_skills_fallback


class TestResumeSkillsFallback:
    """Tests for fallback skill extraction from resume text."""

    def test_extract_common_programming_languages(self):
        """Test extraction of common programming languages."""
        resume_text = """
        Software Engineer with experience in Python, JavaScript, and Java.
        Also proficient in TypeScript and Go for backend services.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Python" in skills
        assert "JavaScript" in skills
        assert "Java" in skills
        assert "TypeScript" in skills
        assert "Go" in skills

    def test_extract_frameworks(self):
        """Test extraction of frameworks and libraries."""
        resume_text = """
        Built web applications using React and Angular on the frontend.
        Backend services developed with Django, Flask, and FastAPI.
        Experience with Node.js and Express for API development.
        """

        skills = extract_skills_fallback(resume_text)

        assert "React" in skills
        assert "Angular" in skills
        assert "Django" in skills
        assert "Flask" in skills
        assert "FastAPI" in skills
        assert "Node.js" in skills
        assert "Express" in skills

    def test_extract_cloud_platforms(self):
        """Test extraction of cloud platforms and DevOps tools."""
        resume_text = """
        Deployed applications on AWS and Azure cloud platforms.
        Containerization with Docker and orchestration using Kubernetes.
        Infrastructure as code with Terraform.
        """

        skills = extract_skills_fallback(resume_text)

        assert "AWS" in skills
        assert "Azure" in skills
        assert "Docker" in skills
        assert "Kubernetes" in skills
        assert "Terraform" in skills

    def test_extract_databases(self):
        """Test extraction of database technologies."""
        resume_text = """
        Database experience includes PostgreSQL, MySQL, and MongoDB.
        Caching with Redis and search with Elasticsearch.
        """

        skills = extract_skills_fallback(resume_text)

        assert "PostgreSQL" in skills
        assert "MySQL" in skills
        assert "MongoDB" in skills
        assert "Redis" in skills
        assert "Elasticsearch" in skills

    def test_extract_data_science_skills(self):
        """Test extraction of data science and ML skills."""
        resume_text = """
        Machine Learning projects using TensorFlow and PyTorch.
        Data analysis with pandas and NumPy.
        Statistical modeling with scikit-learn.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Machine Learning" in skills
        assert "TensorFlow" in skills
        assert "PyTorch" in skills
        assert "pandas" in skills
        assert "NumPy" in skills
        assert "scikit-learn" in skills

    def test_case_insensitive_extraction(self):
        """Test that skill extraction is case insensitive."""
        resume_text = """
        Experience with PYTHON programming.
        Built applications with REACT and Node.js framework.
        Deployed on AWS and used DOCKER containers.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Python" in skills
        assert "React" in skills
        assert "Node.js" in skills
        assert "AWS" in skills
        assert "Docker" in skills

    def test_empty_resume(self):
        """Test extraction from empty resume text."""
        skills = extract_skills_fallback("")
        assert skills == []

    def test_no_matching_skills(self):
        """Test extraction when no known skills are present."""
        resume_text = """
        I am a marketing professional with experience in brand management.
        Strong communication and leadership skills.
        """

        skills = extract_skills_fallback(resume_text)

        # Should find limited or no technical skills
        assert "Python" not in skills
        assert "AWS" not in skills

    def test_skills_in_different_contexts(self):
        """Test extraction of skills mentioned in various contexts."""
        resume_text = """
        Education: B.S. in Computer Science with focus on Python and Java
        Experience: Developed REST APIs using Python Flask
        Projects: Built a React dashboard with PostgreSQL backend
        Skills: Python, JavaScript, SQL, Git, Docker
        """

        skills = extract_skills_fallback(resume_text)

        assert "Python" in skills
        assert "Java" in skills
        assert "REST" in skills
        assert "React" in skills
        assert "PostgreSQL" in skills
        assert "JavaScript" in skills
        assert "SQL" in skills
        assert "Git" in skills
        assert "Docker" in skills

    def test_no_duplicates(self):
        """Test that duplicate skills are not returned."""
        resume_text = """
        Python developer. Used Python for data analysis.
        Python scripts for automation. Python Python Python.
        """

        skills = extract_skills_fallback(resume_text)

        # Count occurrences of Python
        python_count = sum(1 for s in skills if s == "Python")
        assert python_count == 1

    def test_extract_testing_tools(self):
        """Test extraction of testing frameworks."""
        resume_text = """
        Testing experience with Jest for JavaScript and Pytest for Python.
        Automated browser testing with Selenium.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Testing" in skills
        assert "Jest" in skills
        assert "Pytest" in skills
        assert "Selenium" in skills

    def test_extract_version_control(self):
        """Test extraction of version control tools."""
        resume_text = """
        Version control with Git, GitHub, and GitLab.
        CI/CD pipelines with Jenkins and CircleCI.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Git" in skills
        assert "GitHub" in skills
        assert "GitLab" in skills
        assert "CI/CD" in skills
        assert "Jenkins" in skills
        assert "CircleCI" in skills

    def test_extract_methodologies(self):
        """Test extraction of methodologies and practices."""
        resume_text = """
        Worked in Agile/Scrum environments using Jira for project management.
        Experience with Kanban boards and sprint planning.
        """

        skills = extract_skills_fallback(resume_text)

        assert "Agile" in skills
        assert "Scrum" in skills
        assert "Jira" in skills
        assert "Kanban" in skills

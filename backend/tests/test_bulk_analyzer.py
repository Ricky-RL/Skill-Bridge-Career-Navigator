"""
Tests for the bulk job analysis service.
Tests market readiness calculation, skill frequency analysis, and industry matching.
"""
import pytest
from app.services.bulk_analyzer import (
    analyze_bulk_jobs,
    _calculate_market_readiness,
    _get_skill_frequencies,
    _get_missing_skill_frequencies,
    _get_best_industries
)


class TestBulkAnalyzer:
    """Tests for bulk job analysis functionality."""

    def test_analyze_bulk_jobs_basic(self):
        """Test basic bulk analysis with multiple jobs."""
        user_skills = ["Python", "SQL", "Git"]
        job_postings = [
            {
                "id": "job1",
                "title": "Software Engineer",
                "company": "Company A",
                "industry": "Technology",
                "experience_level": "Mid",
                "required_skills": ["Python", "SQL", "Docker"]
            },
            {
                "id": "job2",
                "title": "Data Analyst",
                "company": "Company B",
                "industry": "Finance",
                "experience_level": "Entry",
                "required_skills": ["Python", "SQL", "Excel"]
            }
        ]

        result = analyze_bulk_jobs(user_skills, job_postings)

        assert result["total_jobs_analyzed"] == 2
        assert "market_readiness_score" in result
        assert "most_requested_skills" in result
        assert "job_matches" in result
        assert len(result["job_matches"]) == 2

    def test_analyze_bulk_jobs_empty_list(self):
        """Test bulk analysis with empty job list."""
        result = analyze_bulk_jobs(["Python"], [])

        assert result["total_jobs_analyzed"] == 0
        assert result["market_readiness_score"] == 0
        assert result["job_matches"] == []

    def test_analyze_bulk_jobs_no_user_skills(self):
        """Test bulk analysis when user has no skills."""
        job_postings = [
            {
                "id": "job1",
                "title": "Developer",
                "company": "Company A",
                "industry": "Tech",
                "required_skills": ["Python", "AWS"]
            }
        ]

        result = analyze_bulk_jobs([], job_postings)

        assert result["total_jobs_analyzed"] == 1
        assert result["job_matches"][0]["match_percentage"] == 0
        assert len(result["job_matches"][0]["missing_skills"]) == 2

    def test_analyze_bulk_jobs_perfect_match(self):
        """Test bulk analysis when user matches all required skills."""
        user_skills = ["Python", "AWS", "Docker"]
        job_postings = [
            {
                "id": "job1",
                "title": "Cloud Engineer",
                "company": "Company A",
                "industry": "Technology",
                "required_skills": ["Python", "AWS", "Docker"]
            }
        ]

        result = analyze_bulk_jobs(user_skills, job_postings)

        assert result["job_matches"][0]["match_percentage"] == 100
        assert len(result["job_matches"][0]["missing_skills"]) == 0

    def test_job_matches_sorted_by_percentage(self):
        """Test that job matches are sorted by match percentage (highest first)."""
        user_skills = ["Python"]
        job_postings = [
            {
                "id": "low",
                "title": "Job Low",
                "company": "A",
                "industry": "Tech",
                "required_skills": ["Python", "AWS", "Docker", "Kubernetes"]  # 25%
            },
            {
                "id": "high",
                "title": "Job High",
                "company": "B",
                "industry": "Tech",
                "required_skills": ["Python"]  # 100%
            },
            {
                "id": "mid",
                "title": "Job Mid",
                "company": "C",
                "industry": "Tech",
                "required_skills": ["Python", "SQL"]  # 50%
            }
        ]

        result = analyze_bulk_jobs(user_skills, job_postings)

        matches = result["job_matches"]
        assert matches[0]["job_id"] == "high"
        assert matches[1]["job_id"] == "mid"
        assert matches[2]["job_id"] == "low"

    def test_most_requested_skills_calculation(self):
        """Test that most requested skills are correctly identified."""
        user_skills = ["Python"]
        job_postings = [
            {"id": "1", "title": "J1", "company": "A", "industry": "Tech",
             "required_skills": ["Python", "AWS", "Docker"]},
            {"id": "2", "title": "J2", "company": "B", "industry": "Tech",
             "required_skills": ["Python", "AWS", "SQL"]},
            {"id": "3", "title": "J3", "company": "C", "industry": "Tech",
             "required_skills": ["Python", "AWS", "React"]},
        ]

        result = analyze_bulk_jobs(user_skills, job_postings)

        skills = result["most_requested_skills"]
        # Python and AWS should appear in all 3 jobs
        python_entry = next((s for s in skills if s["skill"] == "Python"), None)
        aws_entry = next((s for s in skills if s["skill"] == "AWS"), None)

        assert python_entry is not None
        assert python_entry["frequency"] == 3
        assert python_entry["user_has"] is True

        assert aws_entry is not None
        assert aws_entry["frequency"] == 3
        assert aws_entry["user_has"] is False


class TestMarketReadinessCalculation:
    """Tests for market readiness score calculation."""

    def test_market_readiness_empty_results(self):
        """Test market readiness with no results."""
        score = _calculate_market_readiness([], {}, [])
        assert score == 0

    def test_market_readiness_perfect_match(self):
        """Test market readiness when user matches all jobs perfectly."""
        results = [
            {"match_percentage": 100},
            {"match_percentage": 100},
            {"match_percentage": 100}
        ]
        skill_counts = {"Python": 3, "AWS": 3}
        user_skills = ["Python", "AWS"]

        score = _calculate_market_readiness(results, skill_counts, user_skills)

        # Should be high (close to 100)
        assert score >= 90

    def test_market_readiness_no_matches(self):
        """Test market readiness when user matches nothing."""
        results = [
            {"match_percentage": 0},
            {"match_percentage": 0}
        ]
        skill_counts = {"Python": 2, "AWS": 2}
        user_skills = []

        score = _calculate_market_readiness(results, skill_counts, user_skills)

        assert score == 0

    def test_market_readiness_partial_match(self):
        """Test market readiness with partial matches."""
        results = [
            {"match_percentage": 50},
            {"match_percentage": 60},
            {"match_percentage": 70}
        ]
        skill_counts = {"Python": 3, "AWS": 2, "Docker": 1}
        user_skills = ["Python"]

        score = _calculate_market_readiness(results, skill_counts, user_skills)

        # Should be moderate (between 30-70)
        assert 30 <= score <= 70

    def test_market_readiness_capped_at_100(self):
        """Test that market readiness score is capped at 100."""
        results = [{"match_percentage": 100} for _ in range(10)]
        skill_counts = {"Python": 10}
        user_skills = ["Python"]

        score = _calculate_market_readiness(results, skill_counts, user_skills)

        assert score <= 100


class TestSkillFrequencies:
    """Tests for skill frequency calculations."""

    def test_get_skill_frequencies_basic(self):
        """Test basic skill frequency calculation."""
        skill_counts = {"Python": 10, "AWS": 7, "Docker": 3}
        user_skills = ["Python"]
        total_jobs = 10

        result = _get_skill_frequencies(skill_counts, user_skills, total_jobs)

        assert len(result) == 3
        assert result[0]["skill"] == "Python"  # Most frequent
        assert result[0]["frequency"] == 10
        assert result[0]["percentage"] == 100.0
        assert result[0]["user_has"] is True

    def test_get_skill_frequencies_with_limit(self):
        """Test skill frequency with limit parameter."""
        skill_counts = {f"Skill{i}": i for i in range(20)}
        user_skills = []
        total_jobs = 20

        result = _get_skill_frequencies(skill_counts, user_skills, total_jobs, limit=5)

        assert len(result) == 5

    def test_get_skill_frequencies_empty(self):
        """Test skill frequency with empty data."""
        result = _get_skill_frequencies({}, [], 0)
        assert result == []

    def test_get_missing_skill_frequencies(self):
        """Test missing skill frequency calculation."""
        missing_counts = {"AWS": 8, "Docker": 5, "Kubernetes": 3}
        user_skills = ["Python"]  # Not relevant for missing skills
        total_jobs = 10

        result = _get_missing_skill_frequencies(missing_counts, user_skills, total_jobs)

        assert len(result) == 3
        assert result[0]["skill"] == "AWS"
        assert result[0]["user_has"] is False  # All missing skills have user_has=False


class TestBestIndustries:
    """Tests for best industry calculation."""

    def test_get_best_industries_basic(self):
        """Test basic best industry calculation."""
        industry_matches = {
            "Technology": [90, 85, 80],
            "Finance": [70, 65],
            "Healthcare": [50, 45, 40]
        }

        result = _get_best_industries(industry_matches)

        assert len(result) == 3
        assert result[0] == "Technology"  # Highest average
        assert result[1] == "Finance"
        assert result[2] == "Healthcare"

    def test_get_best_industries_empty(self):
        """Test best industries with empty data."""
        result = _get_best_industries({})
        assert result == []

    def test_get_best_industries_with_limit(self):
        """Test best industries respects limit."""
        industry_matches = {
            "Tech": [90],
            "Finance": [80],
            "Healthcare": [70],
            "Retail": [60],
            "Education": [50]
        }

        result = _get_best_industries(industry_matches, limit=2)

        assert len(result) == 2
        assert "Tech" in result
        assert "Finance" in result

    def test_get_best_industries_single_job_per_industry(self):
        """Test best industries when each industry has one job."""
        industry_matches = {
            "Tech": [100],
            "Finance": [50]
        }

        result = _get_best_industries(industry_matches)

        assert result[0] == "Tech"
        assert result[1] == "Finance"

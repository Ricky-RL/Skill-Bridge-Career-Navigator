"""
Happy path test for the skill gap analysis functionality.
"""
import pytest
from app.services.fallback_analyzer import analyze_gap_fallback


class TestAnalyzeGapHappyPath:
    """Tests for successful gap analysis scenarios."""

    def test_analyze_gap_with_partial_match(self):
        """Test analysis when user has some but not all required skills."""
        user_skills = ["Python", "SQL", "Git"]
        required_skills = ["Python", "SQL", "Docker", "AWS", "Kubernetes"]

        result = analyze_gap_fallback(user_skills, required_skills)

        # Should identify matching skills
        assert "python" in [s.lower() for s in result["matching_skills"]]
        assert "sql" in [s.lower() for s in result["matching_skills"]]

        # Should identify missing skills
        assert "docker" in [s.lower() for s in result["missing_skills"]]
        assert "aws" in [s.lower() for s in result["missing_skills"]]
        assert "kubernetes" in [s.lower() for s in result["missing_skills"]]

        # Match percentage should be 40% (2 out of 5)
        assert result["match_percentage"] == 40

        # Should not be AI generated
        assert result["ai_generated"] is False

    def test_analyze_gap_with_all_skills(self):
        """Test analysis when user has all required skills."""
        user_skills = ["Python", "JavaScript", "React", "SQL"]
        required_skills = ["Python", "JavaScript", "React", "SQL"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 4
        assert len(result["missing_skills"]) == 0
        assert result["match_percentage"] == 100
        assert result["estimated_time"] == "You're ready!"

    def test_analyze_gap_with_no_matching_skills(self):
        """Test analysis when user has no matching skills."""
        user_skills = ["Excel", "PowerPoint", "Communication"]
        required_skills = ["Python", "Docker", "Kubernetes"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 0
        assert len(result["missing_skills"]) == 3
        assert result["match_percentage"] == 0

    def test_analyze_gap_with_partial_skill_match(self):
        """Test that partial skill name matching works (e.g., 'React' matches 'React.js')."""
        user_skills = ["React.js", "Node.js"]
        required_skills = ["React", "Node"]

        result = analyze_gap_fallback(user_skills, required_skills)

        # Should match due to substring matching
        assert len(result["matching_skills"]) == 2
        assert result["match_percentage"] == 100

    def test_analyze_gap_returns_recommendations(self):
        """Test that recommendations are generated for missing skills."""
        user_skills = ["Python"]
        required_skills = ["Python", "AWS", "Docker"]
        resources = [
            {"skill_name": "AWS", "resource_name": "AWS Course", "platform": "Coursera"},
            {"skill_name": "Docker", "resource_name": "Docker Tutorial", "platform": "YouTube"},
        ]

        result = analyze_gap_fallback(
            user_skills, required_skills, resources=resources
        )

        assert len(result["recommendations"]) == 2

        # First recommendation should be AWS (priority 1)
        aws_rec = next((r for r in result["recommendations"] if r["skill"].lower() == "aws"), None)
        assert aws_rec is not None
        assert len(aws_rec["resources"]) >= 1

    def test_analyze_gap_estimated_time_calculation(self):
        """Test that estimated time is calculated based on missing skills count."""
        # 0 missing skills
        result = analyze_gap_fallback(["Python"], ["Python"])
        assert result["estimated_time"] == "You're ready!"

        # 2 missing skills
        result = analyze_gap_fallback(["Python"], ["Python", "AWS", "Docker"])
        assert result["estimated_time"] == "1-2 months"

        # 5 missing skills
        result = analyze_gap_fallback(
            [],
            ["Python", "AWS", "Docker", "Kubernetes", "Terraform"]
        )
        assert result["estimated_time"] == "3-6 months"

        # 7 missing skills
        result = analyze_gap_fallback(
            [],
            ["Python", "AWS", "Docker", "Kubernetes", "Terraform", "Go", "React"]
        )
        assert result["estimated_time"] == "6-12 months"

"""
Edge case tests for the fallback analyzer.
Tests scenarios where AI is unavailable or inputs are unusual.
"""
import pytest
from app.services.fallback_analyzer import analyze_gap_fallback


class TestFallbackAnalyzerEdgeCases:
    """Tests for edge cases and error handling in fallback analyzer."""

    def test_empty_user_skills(self):
        """Test analysis when user has no skills."""
        user_skills = []
        required_skills = ["Python", "AWS", "Docker"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 0
        assert len(result["missing_skills"]) == 3
        assert result["match_percentage"] == 0
        assert result["ai_generated"] is False

    def test_empty_required_skills(self):
        """Test analysis when job has no required skills."""
        user_skills = ["Python", "AWS"]
        required_skills = []

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 0
        assert len(result["missing_skills"]) == 0
        # Should handle division by zero gracefully
        assert result["match_percentage"] == 0

    def test_both_empty_skills(self):
        """Test analysis when both skill lists are empty."""
        result = analyze_gap_fallback([], [])

        assert len(result["matching_skills"]) == 0
        assert len(result["missing_skills"]) == 0
        assert result["match_percentage"] == 0

    def test_case_insensitive_matching(self):
        """Test that skill matching is case-insensitive."""
        user_skills = ["PYTHON", "javascript", "ReAcT"]
        required_skills = ["python", "JavaScript", "react"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 3
        assert result["match_percentage"] == 100

    def test_whitespace_handling(self):
        """Test that skills with extra whitespace are handled correctly."""
        user_skills = ["  Python  ", "AWS   ", "   Docker"]
        required_skills = ["Python", "AWS", "Docker"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 3
        assert result["match_percentage"] == 100

    def test_duplicate_skills_in_user_list(self):
        """Test handling of duplicate skills in user's skill list."""
        user_skills = ["Python", "Python", "AWS", "AWS", "AWS"]
        required_skills = ["Python", "AWS", "Docker"]

        result = analyze_gap_fallback(user_skills, required_skills)

        # Should still correctly identify matches
        assert len(result["matching_skills"]) == 2
        assert len(result["missing_skills"]) == 1
        assert result["match_percentage"] == 67  # 2/3 rounded

    def test_special_characters_in_skills(self):
        """Test handling of skills with special characters."""
        user_skills = ["C++", "C#", "Node.js", "Vue.js"]
        required_skills = ["C++", "C#", "Node.js", "React.js"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 3
        assert len(result["missing_skills"]) == 1
        assert "react.js" in [s.lower() for s in result["missing_skills"]]

    def test_none_resources_parameter(self):
        """Test that None resources parameter is handled correctly."""
        result = analyze_gap_fallback(
            ["Python"],
            ["Python", "AWS"],
            resources=None
        )

        assert "recommendations" in result
        assert len(result["recommendations"]) == 1
        # Recommendations should have empty resources list
        assert result["recommendations"][0]["resources"] == []

    def test_empty_resources_parameter(self):
        """Test that empty resources list is handled correctly."""
        result = analyze_gap_fallback(
            ["Python"],
            ["Python", "AWS"],
            resources=[]
        )

        assert len(result["recommendations"]) == 1
        assert result["recommendations"][0]["resources"] == []

    def test_nice_to_have_skills_parameter(self):
        """Test that nice_to_have_skills parameter doesn't affect required analysis."""
        user_skills = ["Python"]
        required_skills = ["Python", "AWS"]
        nice_to_have = ["Docker", "Kubernetes"]

        result = analyze_gap_fallback(
            user_skills,
            required_skills,
            nice_to_have_skills=nice_to_have
        )

        # Only required skills should affect match percentage
        assert result["match_percentage"] == 50
        assert len(result["missing_skills"]) == 1

    def test_very_long_skill_names(self):
        """Test handling of very long skill names."""
        long_skill = "A" * 1000
        user_skills = [long_skill]
        required_skills = [long_skill, "Python"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 1
        assert result["match_percentage"] == 50

    def test_unicode_skill_names(self):
        """Test handling of Unicode characters in skill names."""
        user_skills = ["Python", "机器学习", "データ分析"]
        required_skills = ["Python", "机器学习", "AWS"]

        result = analyze_gap_fallback(user_skills, required_skills)

        assert len(result["matching_skills"]) == 2
        assert result["match_percentage"] == 67

    def test_recommendation_priority_order(self):
        """Test that recommendations are in correct priority order."""
        user_skills = []
        required_skills = ["Python", "AWS", "Docker", "Kubernetes"]

        result = analyze_gap_fallback(user_skills, required_skills)

        # Recommendations should be ordered by priority
        priorities = [r["priority"] for r in result["recommendations"]]
        assert priorities == sorted(priorities)
        assert priorities == [1, 2, 3, 4]

    def test_max_resources_per_skill(self):
        """Test that resources are limited to 3 per skill."""
        resources = [
            {"skill_name": "AWS", "resource_name": f"Resource {i}", "platform": "Test"}
            for i in range(10)
        ]

        result = analyze_gap_fallback(
            [],
            ["AWS"],
            resources=resources
        )

        # Should only include 3 resources
        assert len(result["recommendations"][0]["resources"]) == 3

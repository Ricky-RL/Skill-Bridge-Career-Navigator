"""
Tests for API endpoints using FastAPI TestClient.
Tests health checks, root endpoint, and basic API functionality.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app


client = TestClient(app)


class TestHealthEndpoints:
    """Tests for health and status endpoints."""

    def test_root_endpoint(self):
        """Test the root endpoint returns correct response."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Skill-Bridge Career Navigator API"
        assert data["status"] == "running"

    def test_health_endpoint(self):
        """Test the health check endpoint."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestCORSConfiguration:
    """Tests for CORS middleware configuration."""

    def test_cors_headers_present(self):
        """Test that CORS headers are returned for allowed origins."""
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )

        # Should allow localhost:3000
        assert response.headers.get("access-control-allow-origin") in [
            "http://localhost:3000",
            "*"
        ]

    def test_cors_allows_all_methods(self):
        """Test that CORS allows all HTTP methods."""
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            }
        )

        allowed_methods = response.headers.get("access-control-allow-methods", "")
        # Should allow common methods
        assert "GET" in allowed_methods or "*" in allowed_methods


class TestAPIRoutes:
    """Tests for API route availability."""

    def test_api_routes_registered(self):
        """Test that main API routes are registered."""
        # Get OpenAPI schema which lists all routes
        response = client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        paths = schema.get("paths", {})

        # Check key routes exist
        assert "/api/profiles" in paths or any("/api/profiles" in p for p in paths)
        assert "/api/roles" in paths or any("/api/roles" in p for p in paths)
        assert "/api/analyze" in paths or any("/api/analyze" in p for p in paths)
        assert "/api/job-postings" in paths or any("/api/job-postings" in p for p in paths)

    def test_api_docs_available(self):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_api_redoc_available(self):
        """Test that ReDoc documentation is available."""
        response = client.get("/redoc")
        assert response.status_code == 200


class TestAnalyzeEndpoints:
    """Tests for analyze API endpoints."""

    def test_analyze_resources_endpoint_exists(self):
        """Test that the resources endpoint exists."""
        response = client.get("/api/analyze/resources")
        # Should return 200 or empty list, not 404
        assert response.status_code in [200, 422]  # 422 if missing required params

    def test_analyze_endpoint_requires_body(self):
        """Test that analyze endpoint requires a request body."""
        response = client.post("/api/analyze")
        # Should return 422 for missing body
        assert response.status_code == 422


class TestJobPostingsEndpoints:
    """Tests for job postings API endpoints."""

    def test_get_job_postings_returns_list(self):
        """Test getting job postings returns a list."""
        response = client.get("/api/job-postings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_job_postings_with_limit(self):
        """Test getting job postings with limit parameter."""
        response = client.get("/api/job-postings?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    def test_get_industries_endpoint(self):
        """Test getting available industries."""
        response = client.get("/api/job-postings/industries")
        assert response.status_code == 200
        data = response.json()
        assert "industries" in data
        assert isinstance(data["industries"], list)

    def test_get_companies_endpoint(self):
        """Test getting available companies."""
        response = client.get("/api/job-postings/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert isinstance(data["companies"], list)


class TestRolesEndpoints:
    """Tests for roles API endpoints."""

    def test_get_roles_returns_list(self):
        """Test getting roles returns a list."""
        response = client.get("/api/roles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_roles_with_search(self):
        """Test searching roles."""
        response = client.get("/api/roles?search=engineer")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_categories_endpoint(self):
        """Test getting role categories."""
        response = client.get("/api/roles/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data


class TestCompareEndpoints:
    """Tests for bulk comparison endpoints."""

    def test_compare_industries_endpoint(self):
        """Test getting industries for comparison."""
        response = client.get("/api/compare/industries")
        assert response.status_code == 200
        data = response.json()
        assert "industries" in data

    def test_compare_role_types_endpoint(self):
        """Test getting role types for comparison."""
        response = client.get("/api/compare/role-types")
        assert response.status_code == 200
        data = response.json()
        assert "role_types" in data

    def test_compare_endpoint_requires_body(self):
        """Test that compare endpoint requires a request body."""
        response = client.post("/api/compare")
        assert response.status_code == 422


class TestMentorshipEndpoints:
    """Tests for mentorship API endpoints."""

    def test_list_mentors_endpoint(self):
        """Test listing mentors endpoint exists."""
        response = client.get("/api/mentorship/mentors")
        # Should return 200 with list or 422 if params required
        assert response.status_code in [200, 422]

    def test_mentorship_connections_requires_user_id(self):
        """Test that connections endpoint requires user_id."""
        response = client.get("/api/mentorship/connections")
        # Should require user_id parameter
        assert response.status_code == 422


class TestErrorHandling:
    """Tests for API error handling."""

    def test_404_for_unknown_route(self):
        """Test that unknown routes return 404."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test that wrong HTTP methods return 405."""
        response = client.delete("/")  # Root doesn't support DELETE
        assert response.status_code == 405

    def test_invalid_job_posting_id(self):
        """Test handling of invalid job posting ID."""
        response = client.get("/api/job-postings/invalid-uuid-format")
        # Should return 404 or 422
        assert response.status_code in [404, 422, 500]

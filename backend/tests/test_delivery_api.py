"""Tests for Sprint L20a: API Standardization (Delivery API).

Tests URL consistency, sort/filter syntax, cache headers,
RFC 7807 errors, and rate-limit headers.
"""
import json
from unittest.mock import MagicMock

import pytest

from app.delivery.query_params import FilterParams, SortParams


# --- L20a.1: URL Consistency ---

class TestSortParams:
    """L20a.2: Sort direction syntax."""

    def test_minus_prefix_desc(self):
        s = SortParams()
        s.sort = "-title"
        assert s.parsed() == ("title", "desc")

    def test_colon_asc(self):
        s = SortParams()
        s.sort = "title:asc"
        assert s.parsed() == ("title", "asc")

    def test_colon_desc(self):
        s = SortParams()
        s.sort = "created_at:desc"
        assert s.parsed() == ("created_at", "desc")

    def test_plain_field_uses_order_param(self):
        s = SortParams()
        s.sort = "title"
        s.order = "desc"
        assert s.parsed() == ("title", "desc")

    def test_default_sort_order(self):
        s = SortParams()
        s.sort = "sort_order"
        s.order = "asc"
        assert s.parsed() == ("sort_order", "asc")

    def test_invalid_direction_falls_back(self):
        s = SortParams()
        s.sort = "title:invalid"
        s.order = "asc"
        assert s.parsed() == ("title", "asc")


class TestFilterParams:
    """L20a.2: Bracket-notation filter syntax."""

    def _make_request(self, query_params: dict) -> MagicMock:
        """Create mock request with query params."""
        req = MagicMock()
        req.query_params = query_params
        return req

    def test_simple_eq_filter(self):
        req = self._make_request({"filter[page_type]": "listing"})
        fp = FilterParams.from_request(req)
        assert len(fp.filters) == 1
        assert fp.filters[0] == ("page_type", "eq", "listing")

    def test_explicit_eq_operator(self):
        req = self._make_request({"filter[status][eq]": "active"})
        fp = FilterParams.from_request(req)
        assert fp.filters[0] == ("status", "eq", "active")

    def test_gte_operator(self):
        req = self._make_request({"filter[price][gte]": "100"})
        fp = FilterParams.from_request(req)
        assert fp.filters[0] == ("price", "gte", "100")

    def test_multiple_filters(self):
        req = self._make_request({
            "filter[type]": "hotel",
            "filter[price][lte]": "500",
        })
        fp = FilterParams.from_request(req)
        assert len(fp.filters) == 2

    def test_ignores_non_filter_params(self):
        req = self._make_request({
            "limit": "20",
            "sort": "-title",
            "filter[type]": "tour",
        })
        fp = FilterParams.from_request(req)
        assert len(fp.filters) == 1
        assert fp.filters[0] == ("type", "eq", "tour")

    def test_ignores_invalid_operators(self):
        req = self._make_request({"filter[type][invalid]": "x"})
        fp = FilterParams.from_request(req)
        assert len(fp.filters) == 0

    def test_contains_operator(self):
        req = self._make_request({"filter[name][contains]": "beach"})
        fp = FilterParams.from_request(req)
        assert fp.filters[0] == ("name", "contains", "beach")

    def test_in_operator(self):
        req = self._make_request({"filter[status][in]": "active,featured"})
        fp = FilterParams.from_request(req)
        assert fp.filters[0] == ("status", "in", "active,featured")


# --- L20a.3: Cache Headers ---

class TestCacheHeaders:
    """L20a.3: ETag, Cache-Control, Last-Modified."""

    def test_generate_etag(self):
        from app.delivery.cache_headers import generate_etag
        etag = generate_etag("test content")
        assert etag.startswith('W/"')
        assert etag.endswith('"')

    def test_etag_consistency(self):
        from app.delivery.cache_headers import generate_etag
        e1 = generate_etag("same")
        e2 = generate_etag("same")
        assert e1 == e2

    def test_etag_different_for_different_content(self):
        from app.delivery.cache_headers import generate_etag
        e1 = generate_etag("content-a")
        e2 = generate_etag("content-b")
        assert e1 != e2

    def test_format_http_date(self):
        from datetime import datetime, timezone
        from app.delivery.cache_headers import _format_http_date
        dt = datetime(2026, 3, 15, 10, 0, 0, tzinfo=timezone.utc)
        result = _format_http_date(dt)
        assert "2026" in result
        assert "GMT" in result


# --- L20a.4: RFC 7807 Error Format ---

class TestRFC7807:
    """L20a.4: Problem Details error format."""

    def test_problem_response_structure(self):
        from app.core.error_handler import _problem_response
        resp = _problem_response(404, "Page not found")
        body = json.loads(resp.body.decode())
        assert body["type"] == "https://contypio.com/errors/not-found"
        assert body["title"] == "Not Found"
        assert body["status"] == 404
        assert body["detail"] == "Page not found"
        assert resp.media_type == "application/problem+json"

    def test_validation_error_with_fields(self):
        from app.core.error_handler import _problem_response
        errors = [{"field": "title", "message": "required", "type": "missing"}]
        resp = _problem_response(422, "Validation failed", errors=errors)
        body = json.loads(resp.body.decode())
        assert body["errors"] == errors
        assert body["status"] == 422

    def test_rate_limit_error(self):
        from app.core.error_handler import _problem_response
        resp = _problem_response(429, "Rate limit exceeded")
        body = json.loads(resp.body.decode())
        assert body["type"] == "https://contypio.com/errors/rate-limit-exceeded"

    def test_unknown_status_code(self):
        from app.core.error_handler import _problem_response
        resp = _problem_response(418, "I'm a teapot")
        body = json.loads(resp.body.decode())
        assert body["type"] == "https://contypio.com/errors/error"
        assert body["status"] == 418


# --- L20a.5: Rate Limiting ---

class TestRateLimit:
    """L20a.5: Rate-limit logic."""

    def test_client_key_from_ip(self):
        from app.core.rate_limit import _client_key
        req = MagicMock()
        req.headers = {}
        req.client = MagicMock()
        req.client.host = "192.168.1.1"
        assert _client_key(req) == "ip:192.168.1.1"

    def test_client_key_from_api_key(self):
        from app.core.rate_limit import _client_key
        req = MagicMock()
        req.headers = {"authorization": "Bearer cms_abc123xyz456"}
        assert _client_key(req).startswith("key:")

    def test_client_key_from_forwarded(self):
        from app.core.rate_limit import _client_key
        req = MagicMock()
        req.headers = {"x-forwarded-for": "10.0.0.1, 192.168.1.1"}
        assert _client_key(req) == "ip:10.0.0.1"

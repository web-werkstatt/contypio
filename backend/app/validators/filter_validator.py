"""Filter-Field-Allowlist Validator (S4).

Validates bracket-notation filter parameters against an allowlist.
Prevents arbitrary JSONB field access via filter[internal_field][contains]=secret.
Reference: API1:2023 BOLA, API3:2023 BOPLA.
"""

from fastapi import HTTPException


class FilterValidator:
    """Validates and sanitizes filter parameters against an allowlist."""

    # Fields that are always filterable (top-level model fields)
    GLOBAL_ALLOWED = {"status", "title", "slug", "created_at", "updated_at"}

    # Maximum filter depth (data.category.name = 3 levels)
    MAX_DEPTH = 3

    # Maximum number of simultaneous filters per request
    MAX_FILTERS = 10

    # Allowed filter operators
    ALLOWED_OPERATORS = {"eq", "ne", "gt", "gte", "lt", "lte", "contains", "in"}

    @classmethod
    def validate(
        cls,
        filters: list[tuple[str, str, str]],
        collection_allowed_fields: set[str] | None = None,
    ) -> list[tuple[str, str, str]]:
        """Validate filter tuples (field, op, value) against allowlist.

        Args:
            filters: Parsed filter tuples from query parameters.
            collection_allowed_fields: Collection-specific allowlist
                e.g. {"price", "category", "duration", "country"}

        Returns:
            Validated filter tuples (only allowed fields + operators).

        Raises:
            HTTPException 400 on validation error.
        """
        if len(filters) > cls.MAX_FILTERS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many filters. Maximum: {cls.MAX_FILTERS}, received: {len(filters)}",
            )

        allowed = cls.GLOBAL_ALLOWED.copy()
        if collection_allowed_fields:
            allowed |= collection_allowed_fields

        validated: list[tuple[str, str, str]] = []
        for field_name, op, value in filters:
            # Check depth
            depth = field_name.count(".") + 1
            if depth > cls.MAX_DEPTH:
                raise HTTPException(
                    status_code=400,
                    detail=f"Filter field '{field_name}' exceeds maximum depth of {cls.MAX_DEPTH}",
                )

            # Check allowlist
            if field_name not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Filter field '{field_name}' is not filterable",
                )

            # Check operator
            if op not in cls.ALLOWED_OPERATORS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown filter operator: '{op}'",
                )

            validated.append((field_name, op, value))

        return validated

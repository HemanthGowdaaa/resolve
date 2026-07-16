import uuid
from datetime import date, time
from django.core.exceptions import ValidationError


def validate_reflection_text(value: str) -> None:
    """
    Validates that a reflection text is not empty and does not exceed length limits.
    """
    if not value or not value.strip():
        raise ValidationError("Reflection text cannot be empty.")
    if len(value) > 10000:
        raise ValidationError("Reflection text cannot exceed 10000 characters.")


def validate_uuid(value: str) -> uuid.UUID:
    """
    Validates that a string is a valid UUID version 4.
    """
    try:
        return uuid.UUID(str(value))
    except ValueError:
        raise ValidationError("Invalid UUID format.")


def validate_not_future_date(value: date) -> None:
    """
    Ensures that a reflection date is not in the future.
    """
    if value > date.today():
        raise ValidationError("Reflection date cannot be in the future.")

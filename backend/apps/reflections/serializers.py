from rest_framework import serializers
from apps.reflections.models import Reflection
from apps.common.validators.validators import validate_reflection_text, validate_not_future_date


class ReflectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reflection
        fields = [
            "id",
            "date",
            "reflection_text",
            "version",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "version", "is_deleted", "created_at", "updated_at"]

    def validate_reflection_text(self, value):
        validate_reflection_text(value)
        return value

    def validate_date(self, value):
        validate_not_future_date(value)
        return value

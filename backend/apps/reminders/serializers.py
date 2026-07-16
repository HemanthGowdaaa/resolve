from rest_framework import serializers
from apps.reminders.models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = [
            "id",
            "time",
            "enabled",
            "repeat_daily",
            "version",
            "is_deleted",
            "updated_at",
        ]
        read_only_fields = ["id", "version", "is_deleted", "updated_at"]
        
    def validate_time(self, value):
        # TimeField handles conversion and validation, but we can do extra checks if needed.
        return value

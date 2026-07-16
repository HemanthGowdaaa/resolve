from rest_framework import serializers
from apps.reflections.models import Reflection
from apps.reminders.models import Reminder
from apps.reflections.serializers import ReflectionSerializer
from apps.reminders.serializers import ReminderSerializer


class ReflectionSyncUploadSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=True)
    updated_at = serializers.DateTimeField(required=True)
    
    class Meta:
        model = Reflection
        fields = [
            "id",
            "date",
            "reflection_text",
            "version",
            "is_deleted",
            "updated_at",
        ]


class ReminderSyncUploadSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=True)
    updated_at = serializers.DateTimeField(required=True)
    
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


class SyncRequestSerializer(serializers.Serializer):
    reflections = serializers.ListSerializer(
        child=ReflectionSyncUploadSerializer(),
        required=False,
        default=list
    )
    reminders = serializers.ListSerializer(
        child=ReminderSyncUploadSerializer(),
        required=False,
        default=list
    )
    last_sync_time = serializers.DateTimeField(
        required=False, 
        allow_null=True,
        default=None
    )


class SyncResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    reflections = serializers.ListSerializer(child=ReflectionSerializer())
    reminders = serializers.ListSerializer(child=ReminderSerializer())
    synced_uuids = serializers.ListSerializer(child=serializers.UUIDField())
#

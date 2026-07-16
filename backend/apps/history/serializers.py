from rest_framework import serializers


class HistoryQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True, max_length=255)
    start_date = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    end_date = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    ordering = serializers.ChoiceField(
        choices=["date", "-date", "created_at", "-created_at"],
        required=False,
        default="-date"
    )

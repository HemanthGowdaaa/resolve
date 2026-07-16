from rest_framework import serializers


class CalendarQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    end_date = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])


class CalendarResponseSerializer(serializers.Serializer):
    dates = serializers.ListField(
        child=serializers.DateField(format="%Y-%m-%d")
    )

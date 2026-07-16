from rest_framework import serializers


class StatisticsResponseSerializer(serializers.Serializer):
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_reflections = serializers.IntegerField()
    completion_rate_30_days = serializers.FloatField()

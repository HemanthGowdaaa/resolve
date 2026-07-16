from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.reminders.serializers import ReminderSerializer
from apps.reminders.services import RemindersService


class ReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: ReminderSerializer},
        description="Retrieve the authenticated user's reminder configuration (creates a default 20:00 reminder if none exists)."
    )
    def get(self, request, *args, **kwargs):
        service = RemindersService()
        reminder = service.get_user_reminder(user=request.user)
        serializer = ReminderSerializer(reminder)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=ReminderSerializer,
        responses={200: ReminderSerializer},
        description="Update the authenticated user's reminder configuration."
    )
    def put(self, request, *args, **kwargs):
        serializer = ReminderSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        service = RemindersService()
        reminder = service.update_user_reminder(
            user=request.user,
            time_val=serializer.validated_data.get("time"),
            enabled=serializer.validated_data.get("enabled"),
            repeat_daily=serializer.validated_data.get("repeat_daily")
        )
        
        response_serializer = ReminderSerializer(reminder)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

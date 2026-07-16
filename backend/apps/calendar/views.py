from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.calendar.serializers import CalendarQuerySerializer, CalendarResponseSerializer
from apps.calendar.services import CalendarService


class CalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        parameters=[CalendarQuerySerializer],
        responses={200: CalendarResponseSerializer},
        description="Retrieve a list of dates on which the user has recorded reflections, optionally filtered by start_date and end_date."
    )
    def get(self, request, *args, **kwargs):
        # Validate query parameters
        query_serializer = CalendarQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        
        service = CalendarService()
        dates = service.get_reflection_dates(
            user=request.user,
            start_date=query_serializer.validated_data.get("start_date"),
            end_date=query_serializer.validated_data.get("end_date")
        )
        
        response_serializer = CalendarResponseSerializer(data={"dates": dates})
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.statistics.serializers import StatisticsResponseSerializer
from apps.statistics.services import StatisticsService


class StatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: StatisticsResponseSerializer},
        description="Retrieve the authenticated user's dynamically computed self-improvement statistics."
    )
    def get(self, request, *args, **kwargs):
        service = StatisticsService()
        stats = service.get_statistics(user=request.user)
        serializer = StatisticsResponseSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)

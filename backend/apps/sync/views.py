from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.sync.serializers import SyncRequestSerializer, SyncResponseSerializer
from apps.sync.services import SyncService


class SyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=SyncRequestSerializer,
        responses={200: SyncResponseSerializer},
        description="Sync offline reflections and reminders data with the server database."
    )
    def post(self, request, *args, **kwargs):
        serializer = SyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = SyncService()
        result = service.sync_data(
            user=request.user,
            reflections_data=serializer.validated_data.get("reflections", []),
            reminders_data=serializer.validated_data.get("reminders", []),
            last_sync_time=serializer.validated_data.get("last_sync_time")
        )
        
        response_serializer = SyncResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

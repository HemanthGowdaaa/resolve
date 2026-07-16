from rest_framework import generics, permissions
from drf_spectacular.utils import extend_schema
from apps.history.serializers import HistoryQuerySerializer
from apps.reflections.serializers import ReflectionSerializer
from apps.history.services import HistoryService


class HistoryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReflectionSerializer

    @extend_schema(
        parameters=[HistoryQuerySerializer],
        responses={200: ReflectionSerializer(many=True)},
        description="Retrieve a paginated history of reflections, with optional filtering, search, and ordering."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        # Validate query parameters
        query_serializer = HistoryQuerySerializer(data=self.request.query_params)
        query_serializer.is_valid(raise_exception=True)
        
        service = HistoryService()
        return service.get_history_queryset(
            user=self.request.user,
            search_query=query_serializer.validated_data.get("search"),
            start_date=query_serializer.validated_data.get("start_date"),
            end_date=query_serializer.validated_data.get("end_date"),
            ordering=query_serializer.validated_data.get("ordering", "-date")
        )


class HistorySearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReflectionSerializer

    @extend_schema(
        parameters=[HistoryQuerySerializer],
        responses={200: ReflectionSerializer(many=True)},
        description="Search through reflections history using a query string."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        query_serializer = HistoryQuerySerializer(data=self.request.query_params)
        query_serializer.is_valid(raise_exception=True)
        
        # Enforce that search query is checked (can default to empty if not supplied)
        search_query = query_serializer.validated_data.get("search", "")
        
        service = HistoryService()
        return service.get_history_queryset(
            user=self.request.user,
            search_query=search_query,
            start_date=query_serializer.validated_data.get("start_date"),
            end_date=query_serializer.validated_data.get("end_date"),
            ordering=query_serializer.validated_data.get("ordering", "-date")
        )

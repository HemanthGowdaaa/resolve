from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.reflections.serializers import ReflectionSerializer
from apps.reflections.services import ReflectionsService
from apps.common.permissions.is_owner import IsOwner


class TodayReflectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: ReflectionSerializer},
        description="Retrieve today's active reflection for the authenticated user."
    )
    def get(self, request, *args, **kwargs):
        service = ReflectionsService()
        reflection = service.get_today_reflection(user=request.user)
        serializer = ReflectionSerializer(reflection)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReflectionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=ReflectionSerializer,
        responses={201: ReflectionSerializer},
        description="Create a new daily reflection."
    )
    def post(self, request, *args, **kwargs):
        # We can validate using the serializer
        serializer = ReflectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = ReflectionsService()
        reflection = service.create_reflection(
            user=request.user,
            reflection_text=serializer.validated_data["reflection_text"],
            reflection_date=serializer.validated_data.get("date")
        )
        
        response_serializer = ReflectionSerializer(reflection)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ReflectionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    @extend_schema(
        request=ReflectionSerializer,
        responses={200: ReflectionSerializer},
        description="Update an existing reflection by UUID."
    )
    def put(self, request, uuid, *args, **kwargs):
        # Retrieve the reflection to check IsOwner object level permissions
        service = ReflectionsService()
        
        # We parse the text from the request data
        text = request.data.get("reflection_text")
        if not text:
            return Response(
                {"reflection_text": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        reflection = service.update_reflection(
            user=request.user,
            reflection_id=uuid,
            reflection_text=text
        )
        
        serializer = ReflectionSerializer(reflection)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        responses={204: None},
        description="Soft-delete a reflection by UUID."
    )
    def delete(self, request, uuid, *args, **kwargs):
        service = ReflectionsService()
        service.delete_reflection(user=request.user, reflection_id=uuid)
        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.users.serializers import UserProfileSerializer
from apps.users.services import UsersService


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: UserProfileSerializer},
        description="Retrieve the authenticated user's profile details."
    )
    def get(self, request, *args, **kwargs):
        service = UsersService()
        profile = service.get_user_profile(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        description="Update the authenticated user's profile details."
    )
    def put(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        service = UsersService()
        profile = service.update_user_profile(
            user=request.user,
            full_name=serializer.validated_data.get("full_name"),
            profile_picture=serializer.validated_data.get("profile_picture")
        )
        
        response_serializer = UserProfileSerializer(profile)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

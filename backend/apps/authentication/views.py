from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from apps.authentication.serializers import (
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    TokenSerializer
)
from apps.authentication.services import AuthenticationService


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        request=RegisterSerializer,
        responses={201: TokenSerializer},
        description="Register a new user with email, password, and full name."
    )
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = AuthenticationService()
        user = service.register_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            full_name=serializer.validated_data.get("full_name", "")
        )
        
        tokens = service.get_tokens_for_user(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        request=LoginSerializer,
        responses={200: TokenSerializer},
        description="Login with email and password to receive access and refresh JWT tokens."
    )
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = AuthenticationService()
        tokens = service.login_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"]
        )
        return Response(tokens, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: TokenSerializer},
        description="Exchange a Google OAuth ID Token for access and refresh JWT tokens."
    )
    def post(self, request, *args, **kwargs):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = AuthenticationService()
        tokens = service.google_login(token=serializer.validated_data["id_token"])
        return Response(tokens, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=TokenSerializer,
        responses={204: None},
        description="Logout the user by blacklisting their refresh JWT token."
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"refresh": "This field is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        service = AuthenticationService()
        service.logout_user(refresh_token=refresh_token)
        return Response(status=status.HTTP_204_NO_CONTENT)

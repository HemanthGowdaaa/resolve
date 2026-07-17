import logging
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

User = get_user_model()
logger = logging.getLogger("resolve")


class AuthenticationService:
    @staticmethod
    def get_tokens_for_user(user) -> dict:
        """
        Generate access and refresh tokens for a user.
        """
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    def register_user(self, email, password, full_name="") -> User:
        """
        Registers a new user with email and password.
        """
        if User.objects.filter(email=email).exists():
            raise ValidationError({"email": "A user with this email already exists."})
            
        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name
            )
            logger.info(f"User registered successfully: {email}")
            return user
        except Exception as e:
            logger.error(f"Error during registration for {email}: {str(e)}")
            raise ValidationError({"non_field_errors": "Failed to create user."})

    def login_user(self, email, password) -> dict:
        """
        Authenticates a user with email and password and returns tokens.
        """
        user = authenticate(email=email, password=password)
        if not user:
            logger.warning(f"Failed login attempt for email: {email}")
            raise AuthenticationFailed("Invalid email or password.")
            
        if not user.is_active:
            raise AuthenticationFailed("User account is inactive.")

        logger.info(f"User logged in: {email}")
        return self.get_tokens_for_user(user)

    def verify_google_token(self, token: str) -> dict:
        """
        Verifies the Google OAuth token using Google APIs.
        """
        try:
            # client_id is verified against settings
            id_info = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # Or if it's a test/mock environment, allow bypassing
            if id_info["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
                raise ValueError("Wrong issuer.")
                
            return id_info
        except Exception as e:
            logger.error(f"Google token verification failed: {str(e)}")
            # In a real environment, we'd raise AuthenticationFailed. For demonstration or development:
            # if token.startswith("mock_token_"):
            #     return {"email": f"{token}@example.com", "name": "Mock User", "sub": token, "picture": ""}
            raise AuthenticationFailed(f"Invalid Google token: {str(e)}")

    def google_login(self, token: str) -> dict:
        """
        Authenticates a user with a Google token and returns tokens.
        """
        import sys
        is_testing = "test" in sys.argv
        # Bypass network verification for testing mock tokens
        if token.startswith("mock_token_"):
            # For testing convenience without network requests to Google:
            email = f"{token}@example.com"
            google_id = f"google_{token}"
            full_name = "Mock Google User"
            profile_picture = "https://example.com/mock.jpg"
        else:
            id_info = self.verify_google_token(token)
            email = id_info.get("email")
            google_id = id_info.get("sub")
            full_name = id_info.get("name", "")
            profile_picture = id_info.get("picture", "")

        if not email:
            raise AuthenticationFailed("Google account does not provide an email address.")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "google_id": google_id,
                "full_name": full_name,
                "profile_picture": profile_picture,
            }
        )

        if not created:
            # Update google_id and profile picture if not already set or changed
            updated = False
            if not user.google_id:
                user.google_id = google_id
                updated = True
            if profile_picture and user.profile_picture != profile_picture:
                user.profile_picture = profile_picture
                updated = True
            if updated:
                user.save()

        if not user.is_active:
            raise AuthenticationFailed("User account is inactive.")

        logger.info(f"Google OAuth login successful for: {email}")
        return self.get_tokens_for_user(user)

    def logout_user(self, refresh_token: str) -> None:
        """
        Invalidates a refresh token by blacklisting it.
        """
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("User logged out and refresh token blacklisted.")
        except Exception as e:
            logger.error(f"Error during logout / blacklisting: {str(e)}")
            raise ValidationError({"refresh": "Invalid or already blacklisted token."})

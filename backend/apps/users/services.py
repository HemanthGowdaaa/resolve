import logging
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger("resolve")


class UsersService:
    def get_user_profile(self, user) -> User:
        """
        Retrieves the profile of the authenticated user.
        """
        return user

    def update_user_profile(self, user, full_name: str = None, profile_picture: str = None) -> User:
        """
        Updates the full name and profile picture URL for the user.
        """
        updated = False
        if full_name is not None and user.full_name != full_name:
            user.full_name = full_name
            updated = True
        if profile_picture is not None and user.profile_picture != profile_picture:
            user.profile_picture = profile_picture
            updated = True
            
        if updated:
            user.save()
            logger.info(f"User profile updated: {user.email}")
            
        return user

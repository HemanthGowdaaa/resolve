import logging
from datetime import date
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from apps.reflections.models import Reflection
from apps.common.validators.validators import validate_reflection_text

logger = logging.getLogger("resolve")


class ReflectionsService:
    def get_today_reflection(self, user) -> Reflection:
        """
        Retrieve today's active reflection for the user.
        """
        today = date.today()
        try:
            return Reflection.objects.get(user=user, date=today, is_deleted=False)
        except Reflection.DoesNotExist:
            logger.info(f"No reflection found for user {user.email} today ({today})")
            raise NotFound("No reflection has been created for today yet.")

    def create_reflection(self, user, reflection_text: str, reflection_date: date = None) -> Reflection:
        """
        Create a new reflection for a user. Enforces one active reflection per date.
        """
        if reflection_date is None:
            reflection_date = date.today()
            
        validate_reflection_text(reflection_text)

        # Check if an active reflection already exists for this user and date
        existing = Reflection.objects.filter(
            user=user, 
            date=reflection_date, 
            is_deleted=False
        ).exists()
        
        if existing:
            raise ValidationError(
                {"date": f"A reflection has already been recorded for {reflection_date}."}
            )

        # If a soft-deleted reflection exists, we can reactivate or update it,
        # but to keep it simple and clean, we create a new one. Or if there is a soft-deleted one,
        # we can purge it or overwrite it. Let's purge any soft-deleted reflection for this date
        # to avoid UUID collisions or multiple entries for the same date.
        Reflection.objects.filter(user=user, date=reflection_date, is_deleted=True).delete()

        reflection = Reflection.objects.create(
            user=user,
            date=reflection_date,
            reflection_text=reflection_text,
            version=1,
            updated_at=timezone.now()
        )
        logger.info(f"Reflection created for user {user.email} on date {reflection_date}: {reflection.id}")
        return reflection

    def update_reflection(self, user, reflection_id: str, reflection_text: str) -> Reflection:
        """
        Update an existing reflection's text. Increments the version for sync conflict resolution.
        """
        validate_reflection_text(reflection_text)
        
        try:
            reflection = Reflection.objects.get(id=reflection_id, user=user)
        except Reflection.DoesNotExist:
            raise NotFound("Reflection not found.")
            
        if reflection.is_deleted:
            raise ValidationError("Cannot update a deleted reflection.")

        reflection.reflection_text = reflection_text
        reflection.version += 1
        reflection.updated_at = timezone.now()
        reflection.save()
        
        logger.info(f"Reflection {reflection.id} updated by user {user.email}. New version: {reflection.version}")
        return reflection

    def delete_reflection(self, user, reflection_id: str) -> Reflection:
        """
        Soft-delete a reflection by setting is_deleted=True and updating version.
        """
        try:
            reflection = Reflection.objects.get(id=reflection_id, user=user)
        except Reflection.DoesNotExist:
            raise NotFound("Reflection not found.")

        if reflection.is_deleted:
            return reflection

        reflection.is_deleted = True
        reflection.version += 1
        reflection.updated_at = timezone.now()
        reflection.save()
        
        logger.info(f"Reflection {reflection.id} soft-deleted by user {user.email}.")
        return reflection

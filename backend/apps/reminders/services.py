import logging
from datetime import time
from django.utils import timezone
from apps.reminders.models import Reminder

logger = logging.getLogger("resolve")


class RemindersService:
    def get_user_reminder(self, user) -> Reminder:
        """
        Retrieves the user's reminder configuration.
        If it doesn't exist, a default reminder at 20:00 (8:00 PM) is created.
        """
        reminder, created = Reminder.objects.filter(is_deleted=False).get_or_create(
            user=user,
            defaults={
                "time": time(20, 0),  # Default 8 PM
                "enabled": True,
                "repeat_daily": True,
                "version": 1,
                "updated_at": timezone.now()
            }
        )
        if created:
            logger.info(f"Created default reminder configuration for user: {user.email}")
        return reminder

    def update_user_reminder(self, user, time_val: time = None, enabled: bool = None, repeat_daily: bool = None) -> Reminder:
        """
        Updates the user's reminder settings.
        Increments the version for sync.
        """
        reminder = self.get_user_reminder(user)
        
        updated = False
        if time_val is not None and reminder.time != time_val:
            reminder.time = time_val
            updated = True
        if enabled is not None and reminder.enabled != enabled:
            reminder.enabled = enabled
            updated = True
        if repeat_daily is not None and reminder.repeat_daily != repeat_daily:
            reminder.repeat_daily = repeat_daily
            updated = True
            
        if updated:
            reminder.version += 1
            reminder.updated_at = timezone.now()
            reminder.save()
            logger.info(f"Updated reminder config for {user.email}. New version: {reminder.version}")
            
        return reminder

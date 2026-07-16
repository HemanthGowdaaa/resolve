import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Reminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminders"
    )
    time = models.TimeField()
    enabled = models.BooleanField(default=True)
    repeat_daily = models.BooleanField(default=True)
    
    # Sync fields
    version = models.IntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "reminders"
        ordering = ["time"]

    def __str__(self):
        return f"{self.user.email} - {self.time} (Enabled: {self.enabled})"

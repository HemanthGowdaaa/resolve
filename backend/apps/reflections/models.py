import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Reflection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reflections"
    )
    date = models.DateField(db_index=True)
    reflection_text = models.TextField()
    version = models.IntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "reflections"
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["date"]),
        ]
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.date}"

from django.contrib import admin
from apps.reminders.models import Reminder


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "time", "enabled", "repeat_daily", "version", "is_deleted")
    list_filter = ("enabled", "repeat_daily", "is_deleted")
    search_fields = ("user__email", "user__full_name")
    ordering = ("time",)
    readonly_fields = ("id", "created_at", "updated_at")
    
    fieldsets = (
        (None, {
            "fields": ("id", "user", "time", "enabled", "repeat_daily")
        }),
        ("Sync Metadata", {
            "fields": ("version", "is_deleted", "created_at", "updated_at")
        }),
    )

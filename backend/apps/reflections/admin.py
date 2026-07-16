from django.contrib import admin
from apps.reflections.models import Reflection


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "date", "version", "is_deleted", "updated_at")
    list_filter = ("date", "is_deleted")
    search_fields = ("user__email", "user__full_name", "reflection_text")
    ordering = ("-date", "-created_at")
    readonly_fields = ("id", "created_at", "updated_at")
    
    fieldsets = (
        (None, {
            "fields": ("id", "user", "date", "reflection_text")
        }),
        ("Sync Metadata", {
            "fields": ("version", "is_deleted", "created_at", "updated_at")
        }),
    )

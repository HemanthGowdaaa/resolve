from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Configure fields to display in lists
    list_display = ("email", "full_name", "google_id", "is_active", "is_staff", "date_joined")
    
    # Configure search and filter behavior
    search_fields = ("email", "full_name", "google_id")
    list_filter = ("is_active", "is_staff", "date_joined")
    ordering = ("email",)
    
    # Read-only fields that admin cannot edit
    readonly_fields = ("id", "date_joined", "created_at", "updated_at")
    
    # Fieldsets define layout in the admin detail form
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "profile_picture", "google_id")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("date_joined", "last_login", "created_at", "updated_at")}),
    )

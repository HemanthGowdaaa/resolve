"""
URL configuration for config project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin Panel
    path("admin/", admin.site.urls),
    
    # OpenAPI Swagger Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    
    # Application Routes
    path("auth/", include("apps.authentication.urls")),
    path("profile/", include("apps.users.urls")),
    path("reflection/", include("apps.reflections.urls")),
    path("history/", include("apps.history.urls")),
    path("calendar/", include("apps.calendar.urls")),
    path("statistics/", include("apps.statistics.urls")),
    path("reminder/", include("apps.reminders.urls")),
    path("sync/", include("apps.sync.urls")),
    path("export/", include("apps.export.urls")),
]

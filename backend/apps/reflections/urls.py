from django.urls import path
from apps.reflections.views import TodayReflectionView, ReflectionCreateView, ReflectionDetailView

urlpatterns = [
    path("today/", TodayReflectionView.as_view(), name="reflection_today"),
    path("", ReflectionCreateView.as_view(), name="reflection_create"),
    path("<uuid:uuid>/", ReflectionDetailView.as_view(), name="reflection_detail"),
]

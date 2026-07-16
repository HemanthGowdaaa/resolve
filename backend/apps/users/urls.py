from django.urls import path
from apps.users.views import UserProfileView

urlpatterns = [
    path("", UserProfileView.as_view(), name="profile"),
]

from django.urls import path
from apps.reminders.views import ReminderView

urlpatterns = [
    path("", ReminderView.as_view(), name="reminder"),
]

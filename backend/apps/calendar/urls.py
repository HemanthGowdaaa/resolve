from django.urls import path
from apps.calendar.views import CalendarView

urlpatterns = [
    path("", CalendarView.as_view(), name="calendar"),
]

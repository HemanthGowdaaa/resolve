from django.urls import path
from apps.statistics.views import StatisticsView

urlpatterns = [
    path("", StatisticsView.as_view(), name="statistics"),
]

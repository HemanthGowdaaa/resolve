from django.urls import path
from apps.history.views import HistoryListView, HistorySearchView

urlpatterns = [
    path("", HistoryListView.as_view(), name="history_list"),
    path("search/", HistorySearchView.as_view(), name="history_search"),
]

from django.urls import path
from apps.sync.views import SyncView

urlpatterns = [
    path("", SyncView.as_view(), name="sync"),
]

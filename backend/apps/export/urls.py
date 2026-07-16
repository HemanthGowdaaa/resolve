from django.urls import path
from apps.export.views import ExportJsonView, ExportCsvView, ExportPdfView

urlpatterns = [
    path("json/", ExportJsonView.as_view(), name="export_json"),
    path("csv/", ExportCsvView.as_view(), name="export_csv"),
    path("pdf/", ExportPdfView.as_view(), name="export_pdf"),
]

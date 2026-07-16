from django.http import HttpResponse, FileResponse
from rest_framework.views import APIView
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema
from apps.export.services import ExportService


class ExportJsonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: str},
        description="Export all user reflection and reminder records in JSON format."
    )
    def get(self, request, *args, **kwargs):
        service = ExportService()
        json_data = service.export_as_json(user=request.user)
        
        response = HttpResponse(json_data, content_type="application/json")
        response["Content-Disposition"] = 'attachment; filename="resolve_export.json"'
        return response


class ExportCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: str},
        description="Export all user reflection records in CSV format."
    )
    def get(self, request, *args, **kwargs):
        service = ExportService()
        csv_buffer = service.export_as_csv(user=request.user)
        
        response = HttpResponse(csv_buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="resolve_export.csv"'
        return response


class ExportPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: bytes},
        description="Export all user reflection records in a publication-grade styled PDF report."
    )
    def get(self, request, *args, **kwargs):
        service = ExportService()
        pdf_buffer = service.export_as_pdf(user=request.user)
        
        response = FileResponse(pdf_buffer, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="resolve_report.pdf"'
        return response

import csv
import io
import json
import logging
from datetime import date
from django.utils import timezone
from apps.reflections.models import Reflection
from apps.reminders.models import Reminder

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

logger = logging.getLogger("resolve")


class ExportService:
    def export_as_json(self, user) -> str:
        """
        Exports all active user reflections and reminders into a single JSON formatted string.
        """
        reflections = Reflection.objects.filter(user=user, is_deleted=False).order_by("-date")
        reminders = Reminder.objects.filter(user=user, is_deleted=False).order_by("time")
        
        data = {
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "date_joined": user.date_joined.isoformat()
            },
            "exported_at": timezone.now().isoformat(),
            "reflections": [
                {
                    "id": str(ref.id),
                    "date": ref.date.isoformat(),
                    "reflection_text": ref.reflection_text,
                    "version": ref.version,
                    "created_at": ref.created_at.isoformat(),
                    "updated_at": ref.updated_at.isoformat()
                } for ref in reflections
            ],
            "reminders": [
                {
                    "id": str(rem.id),
                    "time": rem.time.isoformat(),
                    "enabled": rem.enabled,
                    "repeat_daily": rem.repeat_daily,
                    "version": rem.version,
                    "updated_at": rem.updated_at.isoformat()
                } for rem in reminders
            ]
        }
        
        logger.info(f"Generated JSON export for user: {user.email}")
        return json.dumps(data, indent=2)

    def export_as_csv(self, user) -> io.StringIO:
        """
        Exports reflections into a CSV string buffer.
        """
        reflections = Reflection.objects.filter(user=user, is_deleted=False).order_by("-date")
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # CSV Headers
        writer.writerow(["ID", "Date", "Reflection Text", "Version", "Created At", "Updated At"])
        
        for ref in reflections:
            writer.writerow([
                str(ref.id),
                ref.date.isoformat(),
                ref.reflection_text,
                ref.version,
                ref.created_at.isoformat(),
                ref.updated_at.isoformat()
            ])
            
        logger.info(f"Generated CSV export for user: {user.email}")
        output.seek(0)
        return output

    def export_as_pdf(self, user) -> io.BytesIO:
        """
        Generates a beautifully formatted PDF report of the user's daily reflections.
        """
        reflections = Reflection.objects.filter(user=user, is_deleted=False).order_by("-date")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        # Define premium document styles
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#1A365D"),  # Sleek dark navy
            spaceAfter=15
        )
        
        meta_style = ParagraphStyle(
            name="MetaStyle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#718096"),  # Slate grey
            spaceAfter=25
        )
        
        heading_style = ParagraphStyle(
            name="ReflectionHeading",
            parent=styles["Heading3"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#2B6CB0"),  # Dark blue
            spaceAfter=6
        )
        
        body_style = ParagraphStyle(
            name="ReflectionBody",
            parent=styles["BodyText"],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#2D3748"),  # Dark charcoal
            spaceAfter=15
        )

        story = []
        
        # Title Section
        story.append(Paragraph("Resolve - Self Improvement Report", title_style))
        story.append(Paragraph(
            f"User: {user.full_name or user.email} | Export Date: {date.today().isoformat()}", 
            meta_style
        ))
        story.append(Spacer(1, 10))
        
        if not reflections.exists():
            story.append(Paragraph("No reflections found in your history.", body_style))
        else:
            for ref in reflections:
                # Format: "Reflection for 2026-07-16"
                formatted_date = ref.date.strftime("%B %d, %Y")
                story.append(Paragraph(f"Reflection for {formatted_date}", heading_style))
                story.append(Paragraph(ref.reflection_text.replace("\n", "<br/>"), body_style))
                story.append(Spacer(1, 5))
                
        doc.build(story)
        
        logger.info(f"Generated PDF export for user: {user.email}")
        buffer.seek(0)
        return buffer

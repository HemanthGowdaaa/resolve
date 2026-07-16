import logging
from datetime import date
from django.db.models import Q, QuerySet
from apps.reflections.models import Reflection

logger = logging.getLogger("resolve")


class HistoryService:
    def get_history_queryset(
        self,
        user,
        search_query: str = None,
        start_date: date = None,
        end_date: date = None,
        ordering: str = "-date"
    ) -> QuerySet:
        """
        Retrieves a filtered, ordered, and searchable queryset of active reflections for the user.
        """
        queryset = Reflection.objects.filter(user=user, is_deleted=False)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        if search_query and search_query.strip():
            queryset = queryset.filter(reflection_text__icontains=search_query.strip())

        # Enforce allowed orderings to prevent SQL injection or bad ordering params
        allowed_orderings = ["date", "-date", "created_at", "-created_at"]
        if ordering not in allowed_orderings:
            ordering = "-date"

        queryset = queryset.order_by(ordering)
        logger.info(
            f"Retrieved history queryset for {user.email} (search='{search_query}', order='{ordering}')"
        )
        return queryset

import logging
from datetime import date
from apps.reflections.models import Reflection

logger = logging.getLogger("resolve")


class CalendarService:
    def get_reflection_dates(self, user, start_date: date = None, end_date: date = None) -> list:
        """
        Retrieves a list of dates on which the user has recorded reflections.
        Optionally filters by start_date and end_date.
        """
        queryset = Reflection.objects.filter(user=user, is_deleted=False)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        dates = (
            queryset.order_by("date")
            .values_list("date", flat=True)
            .distinct()
        )
        
        logger.info(f"Retrieved {len(dates)} reflection dates for calendar for user {user.email}")
        return list(dates)

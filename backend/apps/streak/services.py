import logging
from datetime import date, timedelta
from apps.reflections.models import Reflection

logger = logging.getLogger("resolve")


class StreakService:
    def get_streak_data(self, user) -> dict:
        """
        Dynamically calculate current and longest streaks for the user.
        Returns a dictionary with 'current_streak' and 'longest_streak'.
        """
        # Fetch sorted distinct dates of active reflections
        dates = list(
            Reflection.objects.filter(user=user, is_deleted=False)
            .order_by("date")
            .values_list("date", flat=True)
            .distinct()
        )

        if not dates:
            return {
                "current_streak": 0,
                "longest_streak": 0
            }

        # 1. Calculate current streak
        active_dates_set = set(dates)
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        current_streak = 0
        start_check = None
        
        if today in active_dates_set:
            start_check = today
        elif yesterday in active_dates_set:
            start_check = yesterday
            
        if start_check:
            check_date = start_check
            while check_date in active_dates_set:
                current_streak += 1
                check_date -= timedelta(days=1)

        # 2. Calculate longest streak
        longest_streak = 0
        current_len = 0
        prev_date = None
        
        for d in dates:
            if prev_date is None:
                current_len = 1
            elif d == prev_date + timedelta(days=1):
                current_len += 1
            elif d == prev_date:
                # Ignore duplicate dates on same day (if any)
                pass
            else:
                longest_streak = max(longest_streak, current_len)
                current_len = 1
            prev_date = d
            
        longest_streak = max(longest_streak, current_len)

        logger.info(
            f"Calculated streaks for {user.email}: current={current_streak}, longest={longest_streak}"
        )
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak
        }

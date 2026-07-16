import logging
from datetime import date, timedelta
from apps.reflections.models import Reflection
from apps.streak.services import StreakService

logger = logging.getLogger("resolve")


class StatisticsService:
    def get_statistics(self, user) -> dict:
        """
        Gathers user statistics including streaks, total reflections count,
        and completion rates.
        """
        # Calculate streaks
        streak_service = StreakService()
        streak_data = streak_service.get_streak_data(user)
        
        # Calculate total reflections
        total_reflections = Reflection.objects.filter(user=user, is_deleted=False).count()
        
        # Calculate completion rate in the last 30 days
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        
        recent_reflections_count = (
            Reflection.objects.filter(
                user=user,
                date__gte=thirty_days_ago,
                date__lte=today,
                is_deleted=False
            )
            .values("date")
            .distinct()
            .count()
        )
        
        # Completion rate is percentage of the last 30 days with reflections (recent_count / 30 * 100)
        completion_rate = round((recent_reflections_count / 30.0) * 100, 1)

        stats = {
            "current_streak": streak_data["current_streak"],
            "longest_streak": streak_data["longest_streak"],
            "total_reflections": total_reflections,
            "completion_rate_30_days": completion_rate,
        }
        
        logger.info(f"Gathered statistics for user {user.email}: {stats}")
        return stats

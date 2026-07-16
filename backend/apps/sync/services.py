import logging
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.reflections.models import Reflection
from apps.reminders.models import Reminder

User = get_user_model()
logger = logging.getLogger("resolve")


class SyncService:
    def sync_data(self, user, reflections_data: list, reminders_data: list, last_sync_time: datetime = None) -> dict:
        """
        Synchronizes client reflections and reminders with the server.
        Uses version-based and updated_at conflict resolution.
        """
        if last_sync_time is None:
            # Default to Unix epoch to fetch all records if client has never synced
            last_sync_time = timezone.make_aware(datetime(1970, 1, 1))

        synced_uuids = []
        server_updates_reflections = []
        server_updates_reminders = []

        # We use an atomic transaction to ensure synchronization is an all-or-nothing operation
        with transaction.atomic():
            # 1. Process Client Reflections
            for client_ref in reflections_data:
                ref_id = client_ref.get("id")
                client_text = client_ref.get("reflection_text")
                client_date = client_ref.get("date")
                client_ver = client_ref.get("version", 1)
                client_updated_at = client_ref.get("updated_at")
                client_is_deleted = client_ref.get("is_deleted", False)

                try:
                    db_ref = Reflection.objects.get(id=ref_id, user=user)
                    
                    # Resolve conflict
                    if client_ver > db_ref.version:
                        # Client wins (newer version)
                        self._update_db_reflection(db_ref, client_text, client_date, client_ver, client_is_deleted, client_updated_at)
                        synced_uuids.append(ref_id)
                    elif client_ver == db_ref.version:
                        # Versions match, compare updated_at
                        if client_updated_at and client_updated_at > db_ref.updated_at:
                            self._update_db_reflection(db_ref, client_text, client_date, client_ver, client_is_deleted, client_updated_at)
                        synced_uuids.append(ref_id)
                    else:
                        # Server wins (newer version exists on server)
                        # Server update will be gathered automatically later
                        synced_uuids.append(ref_id)  # Mark processed so client knows it was handled
                except Reflection.DoesNotExist:
                    # Record does not exist on server. Create it if not soft-deleted.
                    if not client_is_deleted:
                        Reflection.objects.create(
                            id=ref_id,
                            user=user,
                            date=client_date,
                            reflection_text=client_text,
                            version=client_ver,
                            is_deleted=False,
                            updated_at=client_updated_at or timezone.now()
                        )
                    synced_uuids.append(ref_id)

            # 2. Process Client Reminders
            for client_rem in reminders_data:
                rem_id = client_rem.get("id")
                client_time = client_rem.get("time")
                client_enabled = client_rem.get("enabled", True)
                client_repeat = client_rem.get("repeat_daily", True)
                client_ver = client_rem.get("version", 1)
                client_updated_at = client_rem.get("updated_at")
                client_is_deleted = client_rem.get("is_deleted", False)

                try:
                    db_rem = Reminder.objects.get(id=rem_id, user=user)
                    
                    # Resolve conflict
                    if client_ver > db_rem.version:
                        self._update_db_reminder(db_rem, client_time, client_enabled, client_repeat, client_ver, client_is_deleted, client_updated_at)
                        synced_uuids.append(rem_id)
                    elif client_ver == db_rem.version:
                        if client_updated_at and client_updated_at > db_rem.updated_at:
                            self._update_db_reminder(db_rem, client_time, client_enabled, client_repeat, client_ver, client_is_deleted, client_updated_at)
                        synced_uuids.append(rem_id)
                    else:
                        # Server wins
                        synced_uuids.append(rem_id)
                except Reminder.DoesNotExist:
                    if not client_is_deleted:
                        Reminder.objects.create(
                            id=rem_id,
                            user=user,
                            time=client_time,
                            enabled=client_enabled,
                            repeat_daily=client_repeat,
                            version=client_ver,
                            is_deleted=False,
                            updated_at=client_updated_at or timezone.now()
                        )
                    synced_uuids.append(rem_id)

            # 3. Gather Server-Side Updates
            # We fetch all reflections and reminders updated after last_sync_time
            server_reflections = Reflection.objects.filter(
                user=user, 
                updated_at__gt=last_sync_time
            )
            # Exclude reflections that client sent and are already matching server version
            # (client doesn't need them sent back)
            client_ref_versions = {str(r.get("id")): r.get("version") for r in reflections_data}
            for ref in server_reflections:
                client_ver = client_ref_versions.get(str(ref.id))
                if client_ver is None or ref.version > client_ver:
                    server_updates_reflections.append(ref)

            server_reminders = Reminder.objects.filter(
                user=user, 
                updated_at__gt=last_sync_time
            )
            client_rem_versions = {str(r.get("id")): r.get("version") for r in reminders_data}
            for rem in server_reminders:
                client_ver = client_rem_versions.get(str(rem.id))
                if client_ver is None or rem.version > client_ver:
                    server_updates_reminders.append(rem)

        logger.info(
            f"Sync completed for {user.email}. Client updates applied, synced_uuids={len(synced_uuids)}, "
            f"server_reflections={len(server_updates_reflections)}, server_reminders={len(server_updates_reminders)}"
        )

        return {
            "success": True,
            "reflections": server_updates_reflections,
            "reminders": server_updates_reminders,
            "synced_uuids": synced_uuids
        }

    def _update_db_reflection(self, db_ref, text, date_val, version, is_deleted, updated_at):
        db_ref.reflection_text = text
        db_ref.date = date_val
        db_ref.version = version
        db_ref.is_deleted = is_deleted
        db_ref.updated_at = updated_at or timezone.now()
        db_ref.save()

    def _update_db_reminder(self, db_rem, time_val, enabled, repeat_daily, version, is_deleted, updated_at):
        db_rem.time = time_val
        db_rem.enabled = enabled
        db_rem.repeat_daily = repeat_daily
        db_rem.version = version
        db_rem.is_deleted = is_deleted
        db_rem.updated_at = updated_at or timezone.now()
        db_rem.save()

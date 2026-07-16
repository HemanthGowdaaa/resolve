import { ReflectionsRepository } from "../repositories/reflections";
import { RemindersRepository } from "../repositories/reminders";
import { SyncService } from "../services/sync";
import { useAuthStore } from "../store/useAuthStore";
import { usePreferenceStore } from "../store/usePreferenceStore";

export const SyncManager = {
  isSyncing: false,

  runSync: async () => {
    // Prevent overlapping sync processes
    if (SyncManager.isSyncing) {
      console.log("Sync already in progress, skipping.");
      return { success: false, reason: "in_progress" };
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping sync.");
      return { success: false, reason: "unauthenticated" };
    }

    SyncManager.isSyncing = true;
    console.log("Starting database synchronization...");

    try {
      // 1. Gather last sync timestamp
      const lastSyncTime = usePreferenceStore.getState().lastSyncTime || new Date(1970, 0, 1).toISOString();

      // 2. Fetch local SQLite entries
      const localReflections = ReflectionsRepository.getSyncable();
      const localReminders = RemindersRepository.getSyncable();

      // 3. Map values into JSON payloads
      const payload = {
        reflections: localReflections.map((r) => ({
          id: r.id,
          date: r.date,
          reflection_text: r.reflection_text,
          version: r.version,
          is_deleted: r.is_deleted === 1,
          updated_at: r.updated_at,
        })),
        reminders: localReminders.map((rem) => ({
          id: rem.id,
          time: rem.time,
          enabled: rem.enabled === 1,
          repeat_daily: rem.repeat_daily === 1,
          version: rem.version,
          is_deleted: rem.is_deleted === 1,
          updated_at: rem.updated_at,
        })),
        last_sync_time: lastSyncTime,
      };

      // 4. Send request to backend
      const response = await SyncService.syncData(payload);

      if (response && response.success) {
        const { reflections: serverRefs, reminders: serverRems, synced_uuids } = response;

        // 5. Update local database with server changes
        for (const ref of serverRefs) {
          ReflectionsRepository.upsert(ref);
        }

        for (const rem of serverRems) {
          RemindersRepository.upsert(rem);
        }

        // 6. Hard-delete local soft-deleted items that have successfully synced to backend
        const syncedUuidSet = new Set(synced_uuids);
        
        for (const localRef of localReflections) {
          if (localRef.is_deleted === 1 && syncedUuidSet.has(localRef.id)) {
            ReflectionsRepository.hardDelete(localRef.id);
          }
        }

        for (const localRem of localReminders) {
          if (localRem.is_deleted === 1 && syncedUuidSet.has(localRem.id)) {
            RemindersRepository.hardDelete(localRem.id);
          }
        }

        // 7. Update last sync time
        const newSyncTimestamp = new Date().toISOString();
        usePreferenceStore.getState().setLastSyncTime(newSyncTimestamp);
        
        console.log("Database synchronization completed successfully.");
        SyncManager.isSyncing = false;
        return { success: true };
      } else {
        throw new Error("Invalid sync response structure");
      }
    } catch (error) {
      console.error("Database synchronization failed:", error.message);
      SyncManager.isSyncing = false;
      return { success: false, reason: "api_failure", error };
    }
  }
};
export default SyncManager;

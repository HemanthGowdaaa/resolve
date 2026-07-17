import db from "../database/sqlite";

export const RemindersRepository = {
  getReminder1: () => {
    try {
      let reminder = db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", ["00000000-0000-0000-0000-000000000001"]);
      if (!reminder) {
        const timestamp = new Date().toISOString();
        console.log("[DATABASE] Insert - Seeding default reminder 1 (18:00)");
        db.runSync(
          `INSERT INTO reminders (id, time, enabled, repeat_daily, version, is_deleted, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          ["00000000-0000-0000-0000-000000000001", "18:00:00", 1, 1, 1, 0, timestamp]
        );
        reminder = db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", ["00000000-0000-0000-0000-000000000001"]);
      }
      return reminder;
    } catch (error) {
      console.error("Failed to query default reminder 1:", error);
      return null;
    }
  },

  getReminder2: () => {
    try {
      let reminder = db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", ["00000000-0000-0000-0000-000000000002"]);
      if (!reminder) {
        const timestamp = new Date().toISOString();
        console.log("[DATABASE] Insert - Seeding default reminder 2 (10:00)");
        db.runSync(
          `INSERT INTO reminders (id, time, enabled, repeat_daily, version, is_deleted, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          ["00000000-0000-0000-0000-000000000002", "10:00:00", 0, 1, 1, 0, timestamp]
        );
        reminder = db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", ["00000000-0000-0000-0000-000000000002"]);
      }
      return reminder;
    } catch (error) {
      console.error("Failed to query default reminder 2:", error);
      return null;
    }
  },

  // Backward compatible fallback wrapper
  get: () => {
    return RemindersRepository.getReminder1();
  },

  getSyncable: () => {
    try {
      return db.getAllSync("SELECT * FROM reminders;");
    } catch (error) {
      console.error("Failed to query syncable reminders:", error);
      return [];
    }
  },

  getById: (id) => {
    try {
      return db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", [id]);
    } catch (error) {
      console.error("Failed to query reminder by id:", error);
      return null;
    }
  },

  updateReminder: (id, time, enabled) => {
    const enabledNum = enabled ? 1 : 0;
    const timestamp = new Date().toISOString();
    try {
      console.log(`[DATABASE] Update - Updating reminder row with ID: ${id}`);
      db.runSync(
        `UPDATE reminders 
         SET time = ?, enabled = ?, version = version + 1, updated_at = ?
         WHERE id = ?;`,
        [time, enabledNum, timestamp, id]
      );
      return RemindersRepository.getById(id);
    } catch (error) {
      console.error(`Failed to update reminder ${id}:`, error);
      return null;
    }
  },

  // Backward compatible update alias
  update: (time, enabled, repeatDaily) => {
    return RemindersRepository.updateReminder("00000000-0000-0000-0000-000000000001", time, enabled);
  },

  upsert: (rem) => {
    const enabledNum = rem.enabled ? 1 : 0;
    const repeatNum = rem.repeat_daily ? 1 : 0;
    const isDeletedNum = rem.is_deleted ? 1 : 0;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO reminders (id, time, enabled, repeat_daily, version, is_deleted, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [rem.id, rem.time, enabledNum, repeatNum, rem.version, isDeletedNum, rem.updated_at]
      );
      return true;
    } catch (error) {
      console.error("Failed to upsert reminder:", error);
      return false;
    }
  },

  hardDelete: (id) => {
    try {
      db.runSync("DELETE FROM reminders WHERE id = ?;", [id]);
      return true;
    } catch (error) {
      console.error("Failed to hard delete reminder:", error);
      return false;
    }
  }
};

export default RemindersRepository;

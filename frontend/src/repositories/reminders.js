import db from "../database/sqlite";

export const RemindersRepository = {
  get: () => {
    try {
      let reminder = db.getFirstSync("SELECT * FROM reminders WHERE is_deleted = 0 LIMIT 1;");
      
      // If no local reminder exists, seed a default one (8:00 PM)
      if (!reminder) {
        const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const timestamp = new Date().toISOString();
        db.runSync(
          `INSERT INTO reminders (id, time, enabled, repeat_daily, version, is_deleted, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [uuid, "20:00:00", 1, 1, 1, 0, timestamp]
        );
        reminder = db.getFirstSync("SELECT * FROM reminders WHERE id = ? LIMIT 1;", [uuid]);
      }
      return reminder;
    } catch (error) {
      console.error("Failed to query reminder settings:", error);
      return null;
    }
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

  update: (time, enabled, repeatDaily) => {
    const reminder = RemindersRepository.get();
    if (!reminder) return null;
    
    const enabledNum = enabled ? 1 : 0;
    const repeatNum = repeatDaily ? 1 : 0;
    const timestamp = new Date().toISOString();
    
    try {
      db.runSync(
        `UPDATE reminders 
         SET time = ?, enabled = ?, repeat_daily = ?, version = version + 1, updated_at = ?
         WHERE id = ?;`,
        [time, enabledNum, repeatNum, timestamp, reminder.id]
      );
      return RemindersRepository.getById(reminder.id);
    } catch (error) {
      console.error("Failed to update reminder:", error);
      return null;
    }
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

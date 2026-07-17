import db from "../database/sqlite";

export const ReflectionsRepository = {
  getTodayReflection: () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      return db.getFirstSync(
        "SELECT * FROM reflections WHERE date = ? AND is_deleted = 0 LIMIT 1;",
        [today]
      );
    } catch (error) {
      console.error("Failed to query today's reflection:", error);
      return null;
    }
  },

  getAll: () => {
    try {
      return db.getAllSync(
        "SELECT * FROM reflections WHERE is_deleted = 0 ORDER BY date DESC, created_at DESC;"
      );
    } catch (error) {
      console.error("Failed to query all reflections:", error);
      return [];
    }
  },

  getSyncable: () => {
    try {
      // Returns all reflections (including soft-deleted ones) to sync with server
      return db.getAllSync("SELECT * FROM reflections;");
    } catch (error) {
      console.error("Failed to query syncable reflections:", error);
      return [];
    }
  },

  getById: (id) => {
    try {
      return db.getFirstSync("SELECT * FROM reflections WHERE id = ? LIMIT 1;", [id]);
    } catch (error) {
      console.error("Failed to query reflection by id:", error);
      return null;
    }
  },

  create: (reflectionText, customDate = null) => {
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const dateStr = customDate || new Date().toISOString().split("T")[0];
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[DATABASE] Insert - Creating reflection row with UUID: ${uuid}`);
      db.runSync(
        `INSERT INTO reflections (id, date, reflection_text, version, is_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [uuid, dateStr, reflectionText, 1, 0, timestamp, timestamp]
      );
      return ReflectionsRepository.getById(uuid);
    } catch (error) {
      console.error("Failed to create reflection:", error);
      return null;
    }
  },

  update: (id, reflectionText) => {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[DATABASE] Update - Updating reflection row with ID: ${id}`);
      db.runSync(
        `UPDATE reflections 
         SET reflection_text = ?, version = version + 1, updated_at = ?
         WHERE id = ?;`,
        [reflectionText, timestamp, id]
      );
      return ReflectionsRepository.getById(id);
    } catch (error) {
      console.error("Failed to update reflection:", error);
      return null;
    }
  },

  delete: (id) => {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[DATABASE] Delete - Soft-deleting reflection row with ID: ${id}`);
      db.runSync(
        `UPDATE reflections 
         SET is_deleted = 1, version = version + 1, updated_at = ?
         WHERE id = ?;`,
        [timestamp, id]
      );
      return true;
    } catch (error) {
      console.error("Failed to delete reflection:", error);
      return false;
    }
  },

  upsert: (ref) => {
    const isDeletedNum = ref.is_deleted ? 1 : 0;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO reflections (id, date, reflection_text, version, is_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [ref.id, ref.date, ref.reflection_text, ref.version, isDeletedNum, ref.created_at, ref.updated_at]
      );
      return true;
    } catch (error) {
      console.error("Failed to upsert reflection:", error);
      return false;
    }
  },

  hardDelete: (id) => {
    try {
      db.runSync("DELETE FROM reflections WHERE id = ?;", [id]);
      return true;
    } catch (error) {
      console.error("Failed to hard delete reflection:", error);
      return false;
    }
  }
};
export default ReflectionsRepository;

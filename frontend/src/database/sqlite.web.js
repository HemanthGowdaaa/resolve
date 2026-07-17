// sqlite.web.js
// Graceful fallback mock database for Web environments.
// Prevents Metro bundler from resolving expo-sqlite binary wasm files on Web builds.

class WebMemoryDatabase {
  constructor() {
    this.tables = {
      reflections: {},
      reminders: {}
    };
    console.log("[WebMemoryDatabase] Initialized in-memory SQLite mock database for Web platform.");
  }

  execSync(sql) {
    console.log(`[WebMemoryDatabase] execSync: ${sql}`);
    // Support table deletion on logout
    if (sql.includes("DELETE FROM reflections")) {
      this.tables.reflections = {};
    }
    if (sql.includes("DELETE FROM reminders")) {
      this.tables.reminders = {};
    }
  }

  runSync(sql, params = []) {
    console.log(`[WebMemoryDatabase] runSync: ${sql} | Params:`, params);
    
    // 1. Insert or update reflections
    if (sql.startsWith("INSERT INTO reflections") || sql.startsWith("INSERT OR REPLACE INTO reflections")) {
      const [id, date, reflection_text, version, is_deleted, created_at, updated_at] = params;
      this.tables.reflections[id] = { id, date, reflection_text, version, is_deleted, created_at, updated_at };
    } 
    else if (sql.startsWith("UPDATE reflections")) {
      // e.g., UPDATE reflections SET reflection_text = ?, version = version + 1, updated_at = ? WHERE id = ?
      // or SET is_deleted = 1, version = version + 1, updated_at = ? WHERE id = ?
      if (sql.includes("is_deleted = 1")) {
        const [updated_at, id] = params;
        if (this.tables.reflections[id]) {
          this.tables.reflections[id].is_deleted = 1;
          this.tables.reflections[id].version += 1;
          this.tables.reflections[id].updated_at = updated_at;
        }
      } else {
        const [text, updated_at, id] = params;
        if (this.tables.reflections[id]) {
          this.tables.reflections[id].reflection_text = text;
          this.tables.reflections[id].version += 1;
          this.tables.reflections[id].updated_at = updated_at;
        }
      }
    }
    
    // 2. Insert or update reminders
    else if (sql.startsWith("INSERT INTO reminders") || sql.startsWith("INSERT OR REPLACE INTO reminders")) {
      const [id, time, enabled, repeat_daily, version, is_deleted, updated_at] = params;
      this.tables.reminders[id] = { id, time, enabled, repeat_daily, version, is_deleted, updated_at };
    }
    else if (sql.startsWith("UPDATE reminders")) {
      // UPDATE reminders SET time = ?, enabled = ?, version = version + 1, updated_at = ? WHERE id = ?
      const [time, enabled, updated_at, id] = params;
      if (this.tables.reminders[id]) {
        this.tables.reminders[id].time = time;
        this.tables.reminders[id].enabled = enabled;
        this.tables.reminders[id].version += 1;
        this.tables.reminders[id].updated_at = updated_at;
      }
    }
    
    // 3. Deletions
    else if (sql.startsWith("DELETE FROM reflections")) {
      const [id] = params;
      delete this.tables.reflections[id];
    }
    else if (sql.startsWith("DELETE FROM reminders")) {
      const [id] = params;
      delete this.tables.reminders[id];
    }

    return { changes: 1 };
  }

  getAllSync(sql, params = []) {
    console.log(`[WebMemoryDatabase] getAllSync: ${sql}`);
    if (sql.includes("FROM reflections")) {
      return Object.values(this.tables.reflections).filter(r => r.is_deleted === 0);
    }
    if (sql.includes("FROM reminders")) {
      return Object.values(this.tables.reminders).filter(r => r.is_deleted === 0);
    }
    return [];
  }

  getFirstSync(sql, params = []) {
    console.log(`[WebMemoryDatabase] getFirstSync: ${sql} | Params:`, params);
    if (sql.includes("FROM reflections")) {
      if (sql.includes("WHERE date = ?")) {
        const dateVal = params[0];
        return Object.values(this.tables.reflections).find(r => r.date === dateVal && r.is_deleted === 0) || null;
      }
      if (sql.includes("WHERE id = ?")) {
        const idVal = params[0];
        return this.tables.reflections[idVal] || null;
      }
      return Object.values(this.tables.reflections).find(r => r.is_deleted === 0) || null;
    }
    if (sql.includes("FROM reminders")) {
      if (sql.includes("WHERE id = ?")) {
        const idVal = params[0];
        return this.tables.reminders[idVal] || null;
      }
      return Object.values(this.tables.reminders).find(r => r.is_deleted === 0) || null;
    }
    return null;
  }
}

export const db = new WebMemoryDatabase();
export default db;

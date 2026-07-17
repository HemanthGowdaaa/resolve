import * as SQLite from "expo-sqlite";

let dbInstance;

try {
  dbInstance = SQLite.openDatabaseSync("resolve.db");
  
  // Initialize reflections and reminders schemas
  dbInstance.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      reflection_text TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      time TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      repeat_daily INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    UPDATE reminders SET id = '00000000-0000-0000-0000-000000000001' WHERE id = 'default_reminder_1';
    UPDATE reminders SET id = '00000000-0000-0000-0000-000000000002' WHERE id = 'default_reminder_2';
  `);
  console.log("SQLite database and tables initialized successfully.");
} catch (error) {
  console.warn("SQLite failed to initialize, running on a mock instance:", error.message);
  
  // Mock instance to prevent crashing on Web / Simulated environments
  dbInstance = {
    execSync: () => {},
    runSync: () => ({ changes: 0 }),
    getAllSync: () => [],
    getFirstSync: () => null,
  };
}

export const db = dbInstance;
export default db;

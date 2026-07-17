import { create } from "zustand";
import { preferenceStorage } from "../storage/mmkv";

export const usePreferenceStore = create((set) => ({
  reminderTime: "20:00", // Default 8 PM
  lastSyncTime: null,
  isThemeDark: false,

  setReminderTime: async (time) => {
    await preferenceStorage.setItem("reminderTime", time);
    set({ reminderTime: time });
  },

  setLastSyncTime: async (timestamp) => {
    await preferenceStorage.setItem("lastSyncTime", timestamp);
    set({ lastSyncTime: timestamp });
  },

  setThemeDark: async (isDark) => {
    await preferenceStorage.setItem("isThemeDark", String(isDark));
    set({ isThemeDark: isDark });
  },

  hydrate: async () => {
    try {
      const reminderTime = await preferenceStorage.getItem("reminderTime") || "20:00";
      const lastSyncTime = await preferenceStorage.getItem("lastSyncTime");
      const isThemeDark = await preferenceStorage.getItem("isThemeDark") === "true";
      set({ reminderTime, lastSyncTime, isThemeDark });
    } catch (e) {
      console.warn("Failed to hydrate preferences:", e.message);
    }
  }
}));
export default usePreferenceStore;

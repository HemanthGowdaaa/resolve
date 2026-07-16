import { create } from "zustand";
import { mmkvStorage } from "../storage/mmkv";

export const usePreferenceStore = create((set) => ({
  reminderTime: "20:00", // Default 8 PM
  lastSyncTime: null,
  isThemeDark: false,

  setReminderTime: async (time) => {
    await mmkvStorage.setItem("reminderTime", time);
    set({ reminderTime: time });
  },

  setLastSyncTime: async (timestamp) => {
    await mmkvStorage.setItem("lastSyncTime", timestamp);
    set({ lastSyncTime: timestamp });
  },

  setThemeDark: async (isDark) => {
    await mmkvStorage.setItem("isThemeDark", String(isDark));
    set({ isThemeDark: isDark });
  },

  hydrate: async () => {
    try {
      const reminderTime = await mmkvStorage.getItem("reminderTime") || "20:00";
      const lastSyncTime = await mmkvStorage.getItem("lastSyncTime");
      const isThemeDark = await mmkvStorage.getItem("isThemeDark") === "true";
      set({ reminderTime, lastSyncTime, isThemeDark });
    } catch (e) {
      console.warn("Failed to hydrate preferences:", e.message);
    }
  }
}));
export default usePreferenceStore;

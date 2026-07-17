import { create } from "zustand";
import { secureStorage } from "../storage/mmkv";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setTokens: async (accessToken, refreshToken) => {
    await secureStorage.setItem("accessToken", accessToken);
    await secureStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
  },

  setUser: async (user) => {
    await secureStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  login: async (user, accessToken, refreshToken) => {
    await get().setTokens(accessToken, refreshToken);
    await get().setUser(user);
  },

  logout: async () => {
    // 1. Blacklist tokens on backend (non-blocking dynamic require to avoid circular imports)
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      try {
        const { AuthService } = require("../services/auth");
        AuthService.logout(refreshToken).catch((err) => {
          console.log("Server session blacklist skipped/offline:", err.message);
        });
      } catch (err) {
        console.warn("Failed to load AuthService inline:", err.message);
      }
    }

    // 2. Clear local SQLite database to prevent multi-user data leakage
    try {
      const { db } = require("../database/sqlite");
      db.execSync("DELETE FROM reflections; DELETE FROM reminders;");
      console.log("Local SQLite data wiped on logout.");
    } catch (dbErr) {
      console.warn("Failed to clear local SQLite tables on logout:", dbErr.message);
    }

    // 3. Purge storage preferences and store values
    try {
      const { usePreferenceStore } = require("./usePreferenceStore");
      await usePreferenceStore.getState().setLastSyncTime(null);
      console.log("Last sync timestamp cleared on logout.");
    } catch (prefErr) {
      console.warn("Failed to clear last sync time:", prefErr.message);
    }

    await secureStorage.removeItem("accessToken");
    await secureStorage.removeItem("refreshToken");
    await secureStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await secureStorage.getItem("accessToken");
      const refreshToken = await secureStorage.getItem("refreshToken");
      const userStr = await secureStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: !!accessToken,
        isHydrated: true,
      });
      return !!accessToken;
    } catch (error) {
      console.error("Failed to hydrate auth store:", error);
      set({ isHydrated: true });
      return false;
    }
  }
}));

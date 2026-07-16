import { create } from "zustand";
import { mmkvStorage } from "../storage/mmkv";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setTokens: async (accessToken, refreshToken) => {
    await mmkvStorage.setItem("accessToken", accessToken);
    await mmkvStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
  },

  setUser: async (user) => {
    await mmkvStorage.setItem("user", JSON.stringify(user));
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
    await mmkvStorage.removeItem("accessToken");
    await mmkvStorage.removeItem("refreshToken");
    await mmkvStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await mmkvStorage.getItem("accessToken");
      const refreshToken = await mmkvStorage.getItem("refreshToken");
      const userStr = await mmkvStorage.getItem("user");
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

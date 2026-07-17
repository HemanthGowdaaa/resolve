import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

let SecureStore;
if (Platform.OS !== "web") {
  try {
    SecureStore = require("expo-secure-store");
  } catch (err) {
    console.warn("Failed to load expo-secure-store dynamically:", err.message);
  }
}

// Secure persistence for sensitive details (JWT tokens, user credentials)
export const secureStorage = {
  setItem: async (key, value) => {
    try {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      if (Platform.OS === "web") {
        window.localStorage.setItem(key, stringValue);
      } else if (SecureStore) {
        await SecureStore.setItemAsync(key, stringValue);
      } else {
        await AsyncStorage.setItem(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`SecureStorage setItem failed for key ${key}:`, error);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        return window.localStorage.getItem(key);
      } else if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`SecureStorage getItem failed for key ${key}:`, error);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        window.localStorage.removeItem(key);
      } else if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`SecureStorage removeItem failed for key ${key}:`, error);
      return false;
    }
  }
};

// General storage for non-sensitive data (lastSyncTime, theme, alarm times)
export const preferenceStorage = {
  setItem: async (key, value) => {
    try {
      const stringValue = String(value);
      if (Platform.OS === "web") {
        window.localStorage.setItem(key, stringValue);
      } else {
        await AsyncStorage.setItem(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`PreferenceStorage setItem failed for key ${key}:`, error);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        return window.localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`PreferenceStorage getItem failed for key ${key}:`, error);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        window.localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`PreferenceStorage removeItem failed for key ${key}:`, error);
      return false;
    }
  }
};

// Backward-compatible wrapper mapping to secureStorage
export const mmkvStorage = secureStorage;
export default mmkvStorage;

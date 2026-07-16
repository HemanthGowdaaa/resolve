import AsyncStorage from "@react-native-async-storage/async-storage";

export const mmkvStorage = {
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.warn(`AsyncStorage setItem failed for key ${key}:`, error.message);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`AsyncStorage getItem failed for key ${key}:`, error.message);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`AsyncStorage removeItem failed for key ${key}:`, error.message);
      return false;
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.warn("AsyncStorage clear failed:", error.message);
      return false;
    }
  }
};

export default mmkvStorage;

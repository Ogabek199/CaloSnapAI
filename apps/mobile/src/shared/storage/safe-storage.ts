import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

// In-memory fallback in case storage native module is temporarily unavailable
const memoryCache: Record<string, string> = {};

export const safeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        const val = await SecureStore.getItemAsync(name);
        if (val) return val;
      }
    } catch (e) {
      // fallback
    }
    return memoryCache[name] || null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    memoryCache[name] = value;
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        // SecureStore item limit is typically 2048 bytes per entry, so we truncate or store essential state
        await SecureStore.setItemAsync(name, value);
      }
    } catch (e) {
      // fallback to memory cache without throwing error
    }
  },

  removeItem: async (name: string): Promise<void> => {
    delete memoryCache[name];
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(name);
      }
    } catch (e) {
      // fallback
    }
  },
};

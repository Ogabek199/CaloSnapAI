import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

// In-memory fallback in case storage native module is temporarily unavailable
const memoryCache: Record<string, string> = {};

async function secureGet(key: string): Promise<string | null> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {}
  return null;
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {}
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {}
}

async function plainGet(name: string): Promise<string | null> {
  try {
    const val = await AsyncStorage.getItem(name);
    if (val != null) return val;
  } catch {}
  return memoryCache[name] ?? null;
}

async function plainSet(name: string, value: string): Promise<boolean> {
  memoryCache[name] = value;
  try {
    await AsyncStorage.setItem(name, value);
    return true;
  } catch {
    return false;
  }
}

async function plainRemove(name: string): Promise<void> {
  delete memoryCache[name];
  try {
    await AsyncStorage.removeItem(name);
  } catch {}
}

/**
 * Non-sensitive persisted state. Earlier builds kept every store in SecureStore
 * (2 KB-per-entry limit on Android), so a legacy value is migrated on first read.
 */
export const safeStorage: StateStorage = {
  getItem: async (name) => {
    const val = await plainGet(name);
    if (val != null) return val;
    const legacy = await secureGet(name);
    if (legacy != null && (await plainSet(name, legacy))) {
      await secureDelete(name);
    }
    return legacy;
  },
  setItem: async (name, value) => {
    await plainSet(name, value);
  },
  removeItem: async (name) => {
    await plainRemove(name);
    await secureDelete(name);
  },
};

/**
 * Persists a zustand JSON blob in AsyncStorage but keeps `state.token` in SecureStore.
 * Legacy builds stored the whole blob (token included) in SecureStore under `name`.
 */
export function createTokenSplitStorage(tokenField = 'token'): StateStorage {
  const tokenKey = (name: string) => `${name}.${tokenField}`;

  return {
    getItem: async (name) => {
      const raw = await plainGet(name);
      if (raw == null) {
        return secureGet(name);
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.state) {
          parsed.state[tokenField] = await secureGet(tokenKey(name));
        }
        return JSON.stringify(parsed);
      } catch {
        return raw;
      }
    },
    setItem: async (name, value) => {
      let token: string | null = null;
      let publicValue = value;
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state) {
          token = parsed.state[tokenField] ?? null;
          delete parsed.state[tokenField];
          publicValue = JSON.stringify(parsed);
        }
      } catch {}

      if (token) {
        await secureSet(tokenKey(name), token);
      } else {
        await secureDelete(tokenKey(name));
      }
      if (await plainSet(name, publicValue)) {
        await secureDelete(name);
      }
    },
    removeItem: async (name) => {
      await plainRemove(name);
      await secureDelete(name);
      await secureDelete(tokenKey(name));
    },
  };
}

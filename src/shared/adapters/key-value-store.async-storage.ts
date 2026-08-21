import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStore } from '@/shared/ports/key-value-store';

export function createAsyncStorageStore(): KeyValueStore {
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    },
    async set<T>(key: string, value: T): Promise<void> {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      await AsyncStorage.removeItem(key);
    },
  };
}

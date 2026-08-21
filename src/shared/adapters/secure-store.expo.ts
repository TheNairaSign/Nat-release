import * as SecureStoreNative from 'expo-secure-store';
import { Platform } from 'react-native';

import type { SecureStore } from '@/shared/ports/secure-store';

const memory = new Map<string, string>();

export function createSecureStore(): SecureStore {
  if (Platform.OS === 'web') {
    return {
      async get(key) {
        return memory.get(key) ?? null;
      },
      async set(key, value) {
        memory.set(key, value);
      },
      async remove(key) {
        memory.delete(key);
      },
    };
  }

  return {
    get: (key) => SecureStoreNative.getItemAsync(key),
    set: (key, value) => SecureStoreNative.setItemAsync(key, value),
    remove: (key) => SecureStoreNative.deleteItemAsync(key),
  };
}

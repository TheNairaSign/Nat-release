import type { KeyValueStore } from '@/shared/ports/key-value-store';

export function createMemoryStore(
  seed: Map<string, string> = new Map(),
): KeyValueStore {
  const data = new Map(seed);
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = data.get(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    },
    async set<T>(key: string, value: T): Promise<void> {
      data.set(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

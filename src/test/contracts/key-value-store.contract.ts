import type { KeyValueStore } from '@/shared/ports/key-value-store';

export async function runKeyValueStoreContract(store: KeyValueStore) {
  await store.set('greeting', { hello: 'world' });
  await expect(store.get<{ hello: string }>('greeting')).resolves.toEqual({
    hello: 'world',
  });
  await store.remove('greeting');
  await expect(store.get('greeting')).resolves.toBeNull();
}

import { createMemoryStore } from '@/shared/adapters/key-value-store.memory';
import { runKeyValueStoreContract } from '@/test/contracts/key-value-store.contract';

describe('KeyValueStore memory adapter', () => {
  it('satisfies the port contract', async () => {
    await runKeyValueStoreContract(createMemoryStore());
  });
});

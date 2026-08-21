import { QueryClient } from '@/shared/adapters/react-query';
import { AppState } from 'react-native';

export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void client.invalidateQueries();
      }
    });
  }

  return client;
}

import type { Allowance } from '@/core/allowance';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';

import { allowanceQueryKey, fetchAllowance } from '../api/tokens-api';

/**
 * Someone's AI tokens, as web's `hooks/useAllowance.ts`: `settled` once there is
 * something to show (the answer, a failure, or the count seen earlier this session),
 * so a page waiting on it only ever waits the first time.
 */
export function useAllowance(): {
  allowance: Allowance | null;
  settled: boolean;
} {
  const { http } = usePorts();
  const query = useQuery({
    queryKey: allowanceQueryKey,
    queryFn: () => fetchAllowance(http),
    retry: false,
  });
  return {
    allowance: query.data ?? null,
    settled: query.data !== undefined || query.isError,
  };
}

import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';

import { fetchProfileUser, profileUserQueryKey } from '../api/profile-api';

/** The member's photo URL, shared with the profile screen's own query (same key). */
export function useProfilePhoto(enabled: boolean): string | undefined {
  const { http } = usePorts();
  const query = useQuery({
    queryKey: profileUserQueryKey,
    queryFn: () => fetchProfileUser(http),
    enabled,
  });
  return query.data?.profilePictureUrl;
}

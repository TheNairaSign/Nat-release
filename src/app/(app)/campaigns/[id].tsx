import { useLocalSearchParams } from 'expo-router';

import { CampaignDetailScreen } from '@/features/campaigns';

export default function CampaignDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CampaignDetailScreen id={Array.isArray(id) ? id[0] : id} />;
}

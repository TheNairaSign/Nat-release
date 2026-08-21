import { useLocalSearchParams } from 'expo-router';

import { CreateDropoffScreen } from '@/features/dropoff';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function CreateDropoffRoute() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    mode?: string | string[];
    locationId?: string | string[];
    campaignId?: string | string[];
    campaignLocationIndex?: string | string[];
  }>();
  return (
    <CreateDropoffScreen
      type={first(params.type)}
      mode={first(params.mode)}
      locationId={first(params.locationId)}
      campaignId={first(params.campaignId)}
      campaignLocationIndex={first(params.campaignLocationIndex)}
    />
  );
}

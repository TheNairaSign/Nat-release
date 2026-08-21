import { useLocalSearchParams } from 'expo-router';

import { LogDropoffScreen } from '@/features/dropoff';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function LogDropoffRoute() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    mode?: string | string[];
    locationId?: string | string[];
    campaignId?: string | string[];
  }>();
  return (
    <LogDropoffScreen
      type={first(params.type)}
      mode={first(params.mode)}
      locationId={first(params.locationId)}
      campaignId={first(params.campaignId)}
    />
  );
}

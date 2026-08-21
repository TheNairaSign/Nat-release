import { useLocalSearchParams } from 'expo-router';

import { WhereScreen } from '@/features/where';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function WhereRoute() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    organization?: string | string[];
    locationId?: string | string[];
  }>();
  return (
    <WhereScreen
      type={first(params.type)}
      organization={first(params.organization)}
      locationId={first(params.locationId)}
    />
  );
}

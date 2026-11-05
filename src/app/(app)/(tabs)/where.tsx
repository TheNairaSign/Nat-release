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
    /** DiVA's advice card links with ?materialType= (web's name for it). */
    materialType?: string | string[];
    focus?: string | string[];
    eventId?: string | string[];
  }>();
  return (
    <WhereScreen
      type={first(params.type) ?? first(params.materialType)}
      organization={first(params.organization)}
      locationId={first(params.locationId)}
      initialFocus={first(params.focus)}
      eventId={first(params.eventId)}
    />
  );
}

import { useLocalSearchParams } from 'expo-router';

import { SignUpScreen } from '@/features/auth';

function first(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default function SignUpRoute() {
  const params = useLocalSearchParams();
  return (
    <SignUpScreen
      query={{
        referral: first(params.referral),
        thingsmatch: first(params.thingsmatch),
        origin: first(params.origin),
        tm: first(params.tm),
      }}
    />
  );
}

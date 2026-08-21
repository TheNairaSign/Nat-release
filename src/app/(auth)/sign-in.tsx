import { useLocalSearchParams } from 'expo-router';

import { SignInScreen } from '@/features/auth';

function first(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default function SignInRoute() {
  const params = useLocalSearchParams();
  return <SignInScreen redirectTo={first(params.redirect) || '/home'} />;
}

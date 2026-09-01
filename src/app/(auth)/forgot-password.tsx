import { useLocalSearchParams } from 'expo-router';

import { ForgotPasswordScreen } from '@/features/auth';

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ForgotPasswordRoute() {
  const params = useLocalSearchParams<{ notice?: string | string[] }>();
  return <ForgotPasswordScreen notice={first(params.notice)} />;
}

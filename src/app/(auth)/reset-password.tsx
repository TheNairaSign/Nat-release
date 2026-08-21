import { useLocalSearchParams } from 'expo-router';

import { ResetPasswordScreen } from '@/features/auth';

export default function ResetPasswordRoute() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token =
    typeof params.token === 'string' ? params.token : (params.token?.[0] ?? '');
  return <ResetPasswordScreen token={token} />;
}

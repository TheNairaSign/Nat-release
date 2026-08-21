import { Stack } from 'expo-router';

import { Screen, Text } from '@/shared/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <Screen>
        <Text variant="title">Screen not found</Text>
      </Screen>
    </>
  );
}

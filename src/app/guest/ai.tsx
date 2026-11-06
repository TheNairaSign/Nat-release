import { useLocalSearchParams } from 'expo-router';

import { AiScreen } from '@/features/ai';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function GuestAiRoute() {
  const params = useLocalSearchParams<{
    q?: string | string[];
    text?: string | string[];
    suggestionId?: string | string[];
  }>();
  return (
    <AiScreen
      initialQuestion={first(params.q) ?? first(params.text)}
      suggestionId={first(params.suggestionId)}
    />
  );
}

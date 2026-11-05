import * as Linking from 'expo-linking';

import type { Linking as LinkingPort } from '@/shared/ports/linking';

export function createExpoLinking(): LinkingPort {
  return {
    openUrl: async (url) => {
      await Linking.openURL(url);
    },
    openSettings: async () => {
      await Linking.openSettings();
    },
  };
}

import { Share } from 'react-native';

import type { ShareSheet } from '@/shared/ports/share';

export function createRnShare(): ShareSheet {
  return {
    async share(message: string) {
      await Share.share({ message });
    },
  };
}

import { router } from 'expo-router';

import type { NavigationPort } from '@/shared/ports/navigation';

export function createExpoRouterNavigation(): NavigationPort {
  return {
    navigate(href) {
      router.push(href as never);
    },
    replace(href) {
      router.replace(href as never);
    },
    back() {
      router.back();
    },
  };
}

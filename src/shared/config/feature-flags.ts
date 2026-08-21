import type { FeatureFlags } from '@/shared/ports/feature-flags';

export const defaultFlags: Record<string, boolean> = {
  guestWhere: true,
};

export function createFeatureFlags(
  overrides: Record<string, boolean> = {},
): FeatureFlags {
  const flags = { ...defaultFlags, ...overrides };
  return { isEnabled: (flag) => flags[flag] === true };
}

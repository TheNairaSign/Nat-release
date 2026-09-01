import { createContext, useContext, type ReactNode } from 'react';

import { fonts } from '@/shared/theme/fonts';
import { glass } from '@/shared/theme/glass';
import { layout } from '@/shared/theme/layout';
import { shadow } from '@/shared/theme/shadow';
import {
  minTapTarget,
  motion,
  palette,
  radius,
  space,
  typeScale,
  type ThemeTokens,
} from '@/shared/theme/tokens';

const ThemeContext = createContext<ThemeTokens | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The web client has no dark mode — `tailwind.config.js` defines a single
  // palette and no `dark:` variants — so following the device scheme made the
  // app diverge from the product on any phone set to dark. Pinned to light.
  const scheme = 'light' as const;
  const value: ThemeTokens = {
    space,
    radius,
    type: typeScale,
    motion,
    minTapTarget,
    color: palette[scheme],
    layout,
    shadow,
    font: fonts,
    glass,
  };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeTokens {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}

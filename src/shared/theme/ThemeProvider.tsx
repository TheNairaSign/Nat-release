import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

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
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
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

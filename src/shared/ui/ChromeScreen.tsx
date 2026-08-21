import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export function ChromeScreen({
  children,
  bleed = false,
}: {
  children: ReactNode;
  bleed?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (bleed) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.bg }}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.bg }}
      contentContainerStyle={{
        paddingHorizontal: theme.layout.pagePadX,
        paddingBottom: theme.layout.tabBarReserve + insets.bottom,
        paddingTop: Math.max(theme.layout.headerContentOffset, insets.top),
        maxWidth: theme.layout.appColumnMaxWidth,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {children}
    </ScrollView>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

export function AuthFieldCard({
  children,
  elevated = false,
}: {
  children: ReactNode;
  elevated?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: elevated ? theme.color.borderSolid : theme.color.border,
        backgroundColor: theme.color.surface,
        overflow: 'hidden',
        ...(elevated ? theme.shadow.sm : theme.shadow.none),
      }}
    >
      {children}
    </View>
  );
}

export function AuthHairline() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.color.borderSolid,
        marginHorizontal: theme.layout.fieldPadX,
      }}
    />
  );
}

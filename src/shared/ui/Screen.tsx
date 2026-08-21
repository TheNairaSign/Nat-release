import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export type ScreenProps = ViewProps & {
  padded?: boolean;
};

export function Screen({
  padded = true,
  style,
  children,
  ...props
}: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.bg }}
      accessibilityRole="none"
    >
      <View
        style={[
          {
            flex: 1,
            padding: padded ? theme.space[5] : 0,
            backgroundColor: theme.color.bg,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

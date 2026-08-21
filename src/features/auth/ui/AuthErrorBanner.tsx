import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function AuthErrorBanner({
  message,
  onDismiss,
  strong = false,
}: {
  message: string;
  onDismiss: () => void;
  strong?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      testID="auth-error"
      style={{
        backgroundColor: strong
          ? theme.color.errorBgStrong
          : theme.color.errorBg,
        borderLeftWidth: 4,
        borderLeftColor: strong
          ? theme.color.errorDismiss
          : theme.color.errorBorder,
        padding: theme.layout.errorPad,
        marginBottom: theme.space[4],
        borderTopRightRadius: theme.radius.sm,
        borderBottomRightRadius: theme.radius.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.space[2],
      }}
    >
      <Text
        variant={strong ? 'caption' : 'small'}
        style={{ color: theme.color.danger, flex: 1, lineHeight: 17 }}
      >
        {message}
      </Text>
      <Pressable
        testID="auth-error-dismiss"
        accessibilityRole="button"
        accessibilityLabel="Dismiss error"
        onPress={onDismiss}
        hitSlop={8}
      >
        <Text variant="small" style={{ color: theme.color.errorDismiss }}>
          X
        </Text>
      </Pressable>
    </View>
  );
}

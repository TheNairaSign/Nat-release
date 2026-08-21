import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

type SplitAction = {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
};

export function AuthSplitCta({
  secondary,
  primary,
}: {
  secondary: SplitAction;
  primary: SplitAction;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.color.accent,
      }}
    >
      <SplitHalf action={secondary} filled={false} />
      <SplitHalf action={primary} filled />
    </View>
  );
}

function SplitHalf({
  action,
  filled,
}: {
  action: SplitAction;
  filled: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      disabled={action.disabled}
      onPress={action.onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.layout.splitPadY,
        paddingHorizontal: theme.space[3],
        backgroundColor: filled ? theme.color.accent : theme.color.surface,
        borderLeftWidth: filled ? 1 : 0,
        borderLeftColor: theme.color.accent,
        opacity: action.disabled ? 0.7 : 1,
      }}
    >
      <Text
        variant="caption"
        style={{
          color: filled ? theme.color.accentText : theme.color.accent,
          fontFamily: theme.font.medium,
        }}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

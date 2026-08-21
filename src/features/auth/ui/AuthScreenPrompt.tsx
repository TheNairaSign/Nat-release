import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function AuthScreenPrompt({
  prompt,
  actionLabel,
  onPress,
}: {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Text
      variant="caption"
      muted
      style={{
        textAlign: 'center',
        marginTop: theme.layout.signInFooterMargin,
        fontFamily: theme.font.regular,
      }}
    >
      {prompt}{' '}
      <Text
        variant="caption"
        accessibilityRole="link"
        onPress={onPress}
        style={{ color: theme.color.accent, fontFamily: theme.font.medium }}
      >
        {actionLabel}
      </Text>
    </Text>
  );
}

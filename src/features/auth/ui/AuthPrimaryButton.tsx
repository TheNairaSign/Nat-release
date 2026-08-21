import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function AuthPrimaryButton({
  label,
  disabled,
  ...props
}: PressableProps & { label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.layout.splitPadY,
        paddingHorizontal: theme.space[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.accent,
        borderWidth: 1,
        borderColor: theme.color.accent,
        opacity: disabled ? 0.7 : 1,
      }}
      {...props}
    >
      <Text
        variant="caption"
        style={{ color: theme.color.accentText, fontFamily: theme.font.medium }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

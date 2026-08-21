import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'ghost';
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={{
        minHeight: theme.minTapTarget,
        paddingHorizontal: theme.space[5],
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? theme.color.accent : 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}
      {...props}
    >
      <Text
        style={{ color: primary ? theme.color.accentText : theme.color.accent }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

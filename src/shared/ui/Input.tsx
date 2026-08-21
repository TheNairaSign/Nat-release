import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/shared/theme';

export type InputProps = TextInputProps & {
  label: string;
};

export function Input({ label, style, ...props }: InputProps) {
  const theme = useTheme();
  return (
    <TextInput
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor={theme.color.textMuted}
      style={[
        {
          minHeight: theme.minTapTarget,
          borderWidth: 1,
          borderColor: theme.color.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space[4],
          color: theme.color.text,
          backgroundColor: theme.color.surface,
          fontSize: theme.type.body,
        },
        style,
      ]}
      {...props}
    />
  );
}

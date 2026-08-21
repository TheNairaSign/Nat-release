import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/shared/theme';

export function AuthTextField({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.color.placeholder}
      style={[
        {
          paddingHorizontal: theme.layout.fieldPadX,
          paddingVertical: theme.layout.fieldPadY,
          fontSize: theme.type.body,
          fontFamily: theme.font.regular,
          color: theme.color.ink,
        },
        style,
      ]}
      {...props}
    />
  );
}

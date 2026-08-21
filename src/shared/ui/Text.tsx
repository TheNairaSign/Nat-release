import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/shared/theme';

type Variant = 'title' | 'heading' | 'body' | 'caption' | 'small';

export type TextProps = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
};

function familyFor(
  variant: Variant,
  font: ReturnType<typeof useTheme>['font'],
): string {
  if (variant === 'title') return font.bold;
  if (variant === 'heading') return font.semibold;
  if (variant === 'caption') return font.medium;
  return font.regular;
}

export function Text({
  variant = 'body',
  muted = false,
  style,
  ...props
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        {
          color: muted ? theme.color.textMuted : theme.color.text,
          fontSize: theme.type[variant],
          fontFamily: familyFor(variant, theme.font),
        },
        style,
      ]}
      {...props}
    />
  );
}

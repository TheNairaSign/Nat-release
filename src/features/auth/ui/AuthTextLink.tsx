import { Pressable } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function AuthTextLink({
  label,
  onPress,
  align = 'end',
}: {
  label: string;
  onPress: () => void;
  align?: 'start' | 'end' | 'center';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        alignSelf:
          align === 'end'
            ? 'flex-end'
            : align === 'center'
              ? 'center'
              : 'flex-start',
        paddingVertical: theme.space[1],
      }}
    >
      <Text
        variant="small"
        muted
        style={{
          textDecorationLine: 'underline',
          textDecorationColor: theme.color.borderSolid,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

import { Pressable } from 'react-native';

import { useTheme } from '@/shared/theme';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

export function ScreenBack({
  label = 'Back',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID="screen-back"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
      }}
    >
      <ChevronGlyph color={theme.color.text} size={16} direction="left" />
      <Text variant="small" style={{ fontFamily: theme.font.semibold }}>
        {label}
      </Text>
    </Pressable>
  );
}

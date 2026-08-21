import { Pressable } from 'react-native';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ThingsMatchMark } from '@/shared/ui/BrandMark';
import { Text } from '@/shared/ui/Text';

const THINGSMATCH_URL = 'https://thingsmatch.com/app';

export function ThingsMatchLink({ label }: { label: string }) {
  const theme = useTheme();
  const { linking } = usePorts();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void linking.openUrl(THINGSMATCH_URL)}
      style={{
        alignSelf: 'center',
        marginTop: theme.space[6],
        minHeight: theme.minTapTarget,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[2],
      }}
    >
      <ThingsMatchMark />
      <Text variant="small" style={{ color: theme.color.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

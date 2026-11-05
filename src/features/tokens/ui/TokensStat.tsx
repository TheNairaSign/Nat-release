import { Pressable, View } from 'react-native';

import { tk, type Allowance } from '@/core/allowance';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { ArrowUpRightGlyph } from '@/shared/ui/icons/featherGlyphs';

/**
 * The right half of the CU card: AI tokens used this month, "320/1,000 TK used". Opens
 * the tokens page. Nothing where tokens aren't counted or couldn't be read.
 * Web: pages/dashboard/profile/TokensStat.tsx.
 */
export function TokensStat({
  allowance,
  onPress,
}: {
  allowance: Allowance | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  if (!allowance?.enabled) return null;
  const { used, total } = allowance.tokens;

  return (
    <Pressable
      testID="profile-tokens"
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`AI tokens: ${tk(used)} of ${tk(total)} used. See details`}
      // web: `-my-1 -mr-1 flex-col items-end justify-between rounded-xl py-1 pl-4 pr-1`
      style={{
        marginVertical: -4,
        marginRight: -4,
        paddingVertical: 4,
        paddingLeft: 16,
        paddingRight: 4,
        borderRadius: 12,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}
    >
      {/* web: 22pt #D1FF52 circle, FiArrowUpRight 14 at stroke 2.5, #14361B */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#D1FF52',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArrowUpRightGlyph color="#14361B" size={14} strokeWidth={2.5} />
      </View>
      <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize: 24,
            lineHeight: 24,
            fontFamily: theme.font.bold,
            color: '#111111',
            fontVariant: ['tabular-nums'],
          }}
        >
          {tk(used)}
          <Text
            style={{
              fontSize: 15,
              fontFamily: theme.font.semibold,
              color: '#94a3b8',
            }}
          >
            /{tk(total)}
          </Text>
        </Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
          TK used
        </Text>
      </View>
    </Pressable>
  );
}

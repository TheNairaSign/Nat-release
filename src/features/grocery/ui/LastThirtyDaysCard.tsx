import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

/** One side of the split bar, 23 tall, with a faint highlight running along it. */
function Bar({ color, grow }: { color: string; grow: number }) {
  return (
    <View
      style={{
        flexGrow: grow,
        flexBasis: 0,
        minWidth: 23,
        height: 23,
        borderRadius: 12,
        backgroundColor: color,
        boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 8,
          right: 9,
          top: 8,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      />
    </View>
  );
}

/**
 * "Last 30 days" (prototype Flow 3, "Current list"; web components/grocery/
 * LastThirtyDaysCard): a 150-tall card at 45% #F0EFF0, the diverted share large on the
 * left with "Diverted" beside it, the landfilled share small and red on the right, and a
 * split bar under them — green for diverted, red for landfilled.
 */
export function LastThirtyDaysCard({ share }: { share: number }) {
  const theme = useTheme();
  const diverted = Math.round(Math.min(1, Math.max(0, share)) * 100);
  const landfilled = 100 - diverted;

  return (
    <View
      testID="grocery-stats"
      style={{
        marginHorizontal: -3,
        marginTop: 6,
        height: 150,
        borderRadius: 38,
        backgroundColor: 'rgba(240,239,240,0.45)',
      }}
    >
      <Text style={{ position: 'absolute', left: 49, top: 18, fontSize: 12, lineHeight: 14, color: '#1E0D2A' }}>
        Last 30 days
      </Text>

      <View style={{ position: 'absolute', left: 52, top: 45, flexDirection: 'row', alignItems: 'center', gap: 26 }}>
        <Text style={{ fontSize: 34, lineHeight: 38, fontFamily: theme.font.bold, letterSpacing: -1.36, color: '#1E0D2A' }}>
          {diverted}%
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 17, fontFamily: theme.font.bold, color: '#000000' }}>Diverted</Text>
      </View>

      {/* Web: 52 wide at right 49. 62 wide here (so "landfilled" never wraps in the app's
          font), moved 5 right to keep the same centre. */}
      <Text
        style={{
          position: 'absolute',
          right: 44,
          top: 41,
          width: 62,
          textAlign: 'center',
          fontSize: 12,
          lineHeight: 14,
          fontFamily: theme.font.bold,
          color: '#9F2530',
        }}
      >
        {`${landfilled}%\nlandfilled`}
      </Text>

      {/* Green reads first, so it sits on the left. */}
      <View style={{ position: 'absolute', left: 29, right: 31, top: 88, flexDirection: 'row', gap: 2 }}>
        {diverted > 0 ? <Bar color="#0A5A14" grow={diverted} /> : null}
        {landfilled > 0 ? <Bar color="#B72735" grow={landfilled} /> : null}
      </View>
    </View>
  );
}

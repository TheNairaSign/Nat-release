import { Pressable, View } from 'react-native';

import { IMPACT_SEGMENT_COUNT, type ImpactMeter } from '@/core/home';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { CountUp } from './CountUp';

const CARBON_UNIT_URL = 'https://www.natcycle.com/carbon-unit';

/**
 * Home's impact, from the prototype (HOME – ActionSlide1 – 8, Nov 2): no card, just
 * the meter on the page. 23 sticks (8×16, 4pt corners) across a 298×30 bar, the level's
 * start and top under its ends and the Carbon Units between. Web Dashboard.tsx.
 */
export function HomeMeter({
  guest,
  meter,
  onImpact,
  onOpenUrl,
}: {
  guest: boolean;
  meter: ImpactMeter;
  onImpact: () => void;
  onOpenUrl: (url: string) => void;
}) {
  const theme = useTheme();
  return (
    <View testID="home-meter" style={{ alignItems: 'center', marginTop: -3 }}>
      <Text style={{ fontSize: 14, lineHeight: 17, fontFamily: theme.font.medium, color: '#010B02' }}>
        You’ve diverted
      </Text>
      <View style={{ marginTop: 4, width: '100%', maxWidth: 298 }}>
        <View
          accessibilityRole="image"
          accessibilityLabel={`${meter.displayCu} of ${meter.end} Carbon Units this level`}
          style={{
            height: 30,
            borderRadius: 15,
            paddingHorizontal: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(28, 15, 40, 0.95)',
          }}
        >
          {Array.from({ length: IMPACT_SEGMENT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 16,
                borderRadius: 4,
                backgroundColor: i < meter.filledSegments ? '#D3FD5D' : '#3F3B39',
              }}
            />
          ))}
        </View>
        <View
          style={{
            marginTop: 3,
            paddingHorizontal: 13,
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 15, color: '#010B02' }}>{meter.start}</Text>
          {guest ? (
            <Text style={{ fontSize: 13, lineHeight: 15, color: '#010B02' }}>
              Register to start saving Carbon Units
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Pressable testID="home-meter-cu" onPress={onImpact}>
                <CountUp
                  to={meter.displayCu}
                  style={{
                    fontSize: 17,
                    lineHeight: 19,
                    fontFamily: theme.font.bold,
                    color: '#1E0D2A',
                    fontVariant: ['tabular-nums'],
                  }}
                />
              </Pressable>
              <Pressable onPress={() => onOpenUrl(CARBON_UNIT_URL)}>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 15,
                    color: '#010B02',
                    textDecorationLine: 'underline',
                  }}
                >
                  Carbon Units
                </Text>
              </Pressable>
            </View>
          )}
          <Text style={{ fontSize: 12, lineHeight: 15, color: '#010B02' }}>{meter.end}</Text>
        </View>
      </View>
    </View>
  );
}

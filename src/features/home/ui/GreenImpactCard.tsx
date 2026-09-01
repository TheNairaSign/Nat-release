import { View } from 'react-native';

import { IMPACT_SEGMENT_COUNT, type ImpactMeter } from '@/core/home';
import { useTheme } from '@/shared/theme';
import { EarthWatermark, GreenImpactIcon, Text } from '@/shared/ui';

import { CountUp } from './CountUp';

export function GreenImpactCard({
  guest,
  meter,
}: {
  guest: boolean;
  meter: ImpactMeter;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        marginBottom: theme.space[5],
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card24,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: theme.space[4],
        overflow: 'hidden',
        ...theme.shadow.sm,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          // web: `-right-5 -bottom-1/2 -translate-y-1/2`
          //  → right: -1.25rem; bottom: -50% of the card; then shifted up by
          //    half the watermark's own height (120 / 2 = 60).
          right: -20,
          bottom: '-50%',
          transform: [{ translateY: -theme.layout.earthWatermark / 2 }],
          width: theme.layout.earthWatermark,
          height: theme.layout.earthWatermark,
        }}
      >
        <EarthWatermark />
      </View>
      <View style={{ zIndex: 1 }}>
        <View
          style={{
            minHeight: 36,
            marginBottom: theme.space[3],
            justifyContent: 'center',
          }}
        >
          <View style={{ position: 'absolute', left: 0, top: 4 }}>
            <GreenImpactIcon />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 10,
                color: theme.color.textMuted,
                fontFamily: theme.font.medium,
                lineHeight: 12,
              }}
            >
              Green Impact
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: theme.font.bold,
                color: theme.color.text,
                marginTop: 2,
                lineHeight: 16,
              }}
            >
              You have saved earth of
            </Text>
          </View>
        </View>

        <View
          style={{
            height: theme.layout.impactMeterHeight,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.limeTrack,
            overflow: 'hidden',
            paddingHorizontal: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {Array.from({ length: IMPACT_SEGMENT_COUNT }).map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: theme.layout.impactSegmentWidth,
                  height: theme.layout.impactSegmentHeight,
                  borderRadius: theme.radius.pill,
                  backgroundColor:
                    index < meter.filledSegments
                      ? theme.color.ink
                      : theme.color.limeTick,
                }}
              />
            </View>
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingHorizontal: 2,
          }}
        >
          <Text style={{ fontSize: 10, color: theme.color.textMuted }}>
            {meter.start}
          </Text>
          <Text style={{ fontSize: 10, color: theme.color.textMuted }}>
            {meter.end}
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          {guest ? (
            <Text
              style={{
                fontSize: 13,
                color: theme.color.textMuted,
                fontFamily: theme.font.medium,
                textAlign: 'center',
              }}
            >
              Register to start saving Carbon Units and earn rewards!
            </Text>
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}
            >
              <CountUp to={meter.displayCu} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: theme.font.medium,
                  color: theme.color.label,
                  textDecorationLine: 'underline',
                  textDecorationColor: theme.color.placeholder,
                }}
              >
                Carbon Units
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

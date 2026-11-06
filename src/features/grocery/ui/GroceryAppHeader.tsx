import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { CameraGlyph } from '@/shared/ui/icons/featherGlyphs';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

/**
 * "beta" on a small hand-drawn leaf, as a superscript beside the app's name: a quiet flag
 * that it's new and still growing (web components/grocery/BetaLeaf).
 */
export function BetaLeaf() {
  return (
    <View
      accessibilityLabel="Beta"
      style={{ marginLeft: 4, marginTop: -8, transform: [{ rotate: '-9deg' }] }}
    >
      <Svg width={40} height={21} viewBox="0 0 44 23">
        <Path d="M4.2 12.6c-1.3.4-2.4 1.5-3.1 3.2" stroke="#0A5A14" strokeWidth={1.3} strokeLinecap="round" fill="none" />
        <Path
          d="M4.1 12.5C7.6 5.9 16.4 1.8 27.3 2.6c6.2.5 10.8 3.2 14.4 6.9.4.4.4 1 0 1.4-4.1 4.7-10.6 9.4-19.8 9.7C13.4 20.9 7.6 17.6 4.1 12.5Z"
          fill="#D3FD5D"
          stroke="#0A5A14"
          strokeWidth={1.25}
          strokeLinejoin="round"
        />
        <Path
          d="M5.6 12.4c9.4-1.6 21.5-2.4 35.2-1.9M15.3 11.3l-3-3.6M27.6 10.6l3.1 4.4"
          stroke="#0A5A14"
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={0.28}
          fill="none"
        />
        <SvgText x={23.4} y={14.6} textAnchor="middle" fontSize={8.4} fontWeight="700" letterSpacing={0.3} fill="#0A5A14">
          beta
        </SvgText>
      </Svg>
    </View>
  );
}

/** History's "New Scan": a 110×31 lime pill with a hairline black edge and the camera. */
export function GroceryNewScan({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      testID="grocery-new-scan"
      onPress={onPress}
      style={{
        height: 31,
        width: 110,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#000000',
        backgroundColor: '#D3FD5D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <CameraGlyph color="#010B02" size={13} />
      <Text style={{ fontSize: 12, fontFamily: theme.font.bold, color: '#010B02' }}>New Scan</Text>
    </Pressable>
  );
}

/** The header's main action ("Scan"): neon green so it's found at a glance. */
export function GroceryHeaderPrimary({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        backgroundColor: '#D1FF52',
        paddingHorizontal: 14,
        paddingVertical: 6,
        shadowColor: '#D1FF52',
        shadowOpacity: 0.55,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <CameraGlyph color="#14361B" size={16} />
      <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#14361B' }}>{label}</Text>
    </Pressable>
  );
}

/** Plain text action for the header's right side ("History"). */
export function GroceryHeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 }}>
      <Text style={{ fontSize: 14, color: '#334155' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * The Grocery Manager's own header, the same on each of its screens: it's a mini app, so
 * it brings its own chrome and NatCycle's header and tab bar step aside. Back leaves the
 * whole app (the app's screens replace one another, so one step back is outside it).
 * Web components/grocery/GroceryAppHeader.
 */
export function GroceryAppHeader({
  right,
  title = 'Grocery Manager',
}: {
  right?: ReactNode;
  /** SnapDivert uses the same header as "ScanDiverter". */
  title?: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { navigation } = usePorts();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 8,
        paddingTop: Math.max(6, insets.top),
        paddingBottom: 6,
      }}
    >
      <Pressable
        testID="grocery-leave"
        accessibilityLabel={`Leave ${title}`}
        onPress={() => navigation.back()}
        style={{ marginLeft: -8, borderRadius: 999, padding: 6 }}
      >
        <ChevronGlyph color="#1F5D20" size={20} direction="left" />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 17, fontFamily: theme.font.semibold, color: '#1F5D20', letterSpacing: -0.2 }}>
          {title}
        </Text>
        <BetaLeaf />
      </View>
      <View style={{ marginLeft: 'auto', marginRight: -8 }}>{right}</View>
    </View>
  );
}

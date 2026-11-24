import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { CameraGlyph } from '@/shared/ui/icons/featherGlyphs';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

/**
 * A plain "BETA" as a superscript beside the app's name: both mini apps are new and still
 * growing (web GroceryAppHeader, Nov 18: `ml-1.5 align-super text-[10px] font-bold
 * tracking-[0.08em] text-[#1F5D20]/70`; it replaced the leaf badge).
 */
export function BetaMark() {
  const theme = useTheme();
  return (
    <Text
      accessibilityLabel="Beta: new, and still growing"
      style={{
        marginLeft: 6,
        marginTop: -2,
        fontSize: 10,
        lineHeight: 12,
        fontFamily: theme.font.bold,
        letterSpacing: 0.8,
        color: 'rgba(31,93,32,0.7)',
      }}
    >
      BETA
    </Text>
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
        <BetaMark />
      </View>
      <View style={{ marginLeft: 'auto', marginRight: -8 }}>{right}</View>
    </View>
  );
}

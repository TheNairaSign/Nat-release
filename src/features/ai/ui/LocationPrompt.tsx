import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { MapPinGlyph } from '@/shared/ui/icons/featherGlyphs';

type Stage = 'ask' | 'asking' | 'blocked' | 'failed';
type Position = { latitude: number; longitude: number };

/** Where to switch it back on: the app's own settings, not a browser's. */
const ENABLE_STEPS =
  Platform.OS === 'ios'
    ? [
        "Open Settings › Privacy & Security › Location Services and make sure it's on.",
        'Then Settings › NatCycle › Location, and choose “While Using the App”.',
      ]
    : [
        'Open Settings › Apps › NatCycle › Permissions › Location › Allow.',
        "Also check that Location is switched on in your phone's quick settings.",
      ];

/**
 * Under a DiVA answer that needed the person's position while location is off: asks to
 * turn it on, then the question is asked again with it. Web: components/ai/LocationPrompt.
 * A phone can't ask twice either, so after a "no" it points to Settings.
 */
export function LocationPrompt({
  initial,
  onLocated,
}: {
  initial: 'prompt' | 'denied';
  onLocated: (position: Position) => void;
}) {
  const theme = useTheme();
  const { location, linking } = usePorts();
  const [stage, setStage] = useState<Stage>(initial === 'denied' ? 'blocked' : 'ask');

  async function turnOn() {
    // A previous "no" can't be asked again; but they may have switched it on since.
    const access = await location.getPermissionStatus().catch(() => 'prompt' as const);
    if (access === 'denied') {
      setStage('blocked');
      return;
    }
    setStage('asking');
    const allowed = access === 'granted' || (await location.requestPermission().catch(() => false));
    if (!allowed) {
      setStage('blocked');
      return;
    }
    const position = await location.getCurrentPosition().catch(() => null);
    if (position) onLocated(position);
    else setStage('failed');
  }

  const body = { marginTop: 4, fontSize: 13, lineHeight: 18, color: '#475569' };

  return (
    <View
      testID="ai-location-prompt"
      style={{
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#F7F8F4',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        gap: 10,
      }}
    >
      <View
        style={{
          marginTop: 2,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: '#DCFE77',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapPinGlyph color="#14361B" size={14} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
          {stage === 'blocked'
            ? 'Location is turned off for NatCycle'
            : stage === 'failed'
              ? "Couldn't get your location"
              : "Turn on location so I can find what's near you"}
        </Text>
        {stage === 'blocked'
          ? ENABLE_STEPS.map((step, i) => (
              <Text key={step} style={body}>
                {i + 1}. {step}
              </Text>
            ))
          : null}
        {stage === 'failed' ? (
          <Text style={body}>
            Check that Location Services is on and you have a signal, then try again.
          </Text>
        ) : null}
        {stage === 'ask' ? (
          <Text style={body}>
            Your phone will ask you to allow it. I only use it to look up places near you.
          </Text>
        ) : null}
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
          <Pressable
            testID="ai-location-turn-on"
            disabled={stage === 'asking'}
            onPress={() => void turnOn()}
            style={{
              borderRadius: 999,
              backgroundColor: '#1C0F28',
              paddingHorizontal: 16,
              paddingVertical: 8,
              opacity: stage === 'asking' ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#ffffff' }}>
              {stage === 'asking'
                ? 'Waiting for permission…'
                : stage === 'ask'
                  ? 'Turn on location'
                  : 'Try again'}
            </Text>
          </Pressable>
          {/* A phone app can open its own settings page, which a browser can't. */}
          {stage === 'blocked' ? (
            <Pressable
              onPress={() => void linking.openSettings()}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.12)',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1C0F28' }}>
                Open Settings
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

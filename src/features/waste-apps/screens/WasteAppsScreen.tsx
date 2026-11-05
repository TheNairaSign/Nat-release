import { useState, type ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { GuestSignInModal } from '@/features/auth';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';
import { GradientFill } from '@/shared/ui/GradientFill';
import { MapPinGlyph } from '@/shared/ui/icons/featherGlyphs';
import { WasteAppsMark } from '@/shared/ui/icons/WasteAppsMark';
import {
  EVENTS_BIN_SVG,
  GROCERY_MANAGER_SVG,
  SNAPDIVERT_SVG,
  THINGSMATCH_SVG,
  WASTE_APPS_ILLUSTRATION_SVG,
} from '@/shared/ui/icons/homeAppIcons';

/** The apps a guest can open without an account (web utils/groceryApp GUEST_APPS). */
const GUEST_APPS = ['/ai/grocery', '/snapdivert'];

/** The brand's 152° gradient at 13%, behind ThingsMatch and DiVA. */
const SOFT_STOPS = [
  { offset: 0, color: 'rgba(135,184,250,0.13)' },
  { offset: 0.318, color: 'rgba(110,237,255,0.13)' },
  { offset: 0.644, color: 'rgba(97,252,121,0.13)' },
  { offset: 1, color: 'rgba(252,191,76,0.13)' },
];

type App = {
  id: string;
  label: string;
  tile: ReactNode;
  icon: ReactNode;
  onPress: () => void;
};

const tileBase = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 21,
  overflow: 'hidden' as const,
};

/**
 * The Waste Apps page (prototype HOME – 48; web pages/dashboard/WasteApps.tsx): the
 * page's own header, "Thinking of more ways to divert?" over the illustration, and a
 * white panel of six apps, 81pt tiles 20pt apart.
 */
export function WasteAppsScreen({ guest = false }: { guest?: boolean }) {
  const theme = useTheme();
  const { navigation, linking } = usePorts();
  const [signIn, setSignIn] = useState(false);

  /** Guests get the two scanners; the rest asks them to sign in. */
  const go = (path: string) => {
    if (!guest) navigation.navigate(path);
    else if (GUEST_APPS.includes(path)) navigation.navigate(`/guest${path}`);
    else setSignIn(true);
  };

  const apps: App[] = [
    {
      id: 'grocery',
      label: 'Grocery manager',
      // The prototype renders #FFD28B → #CE7C00 at about a quarter strength.
      tile: (
        <GradientFill
          angle={180}
          stops={[
            { offset: 0, color: 'rgba(255,210,139,0.26)' },
            { offset: 1, color: 'rgba(206,124,0,0.23)' },
          ]}
        />
      ),
      icon: <SvgXml xml={GROCERY_MANAGER_SVG} width={34} height={40} />,
      onPress: () => go('/ai/grocery'),
    },
    {
      id: 'thingsmatch',
      label: 'Thingsmatch',
      tile: <GradientFill angle={152} stops={SOFT_STOPS} />,
      icon: <SvgXml xml={THINGSMATCH_SVG} width={45.84} height={32.13} />,
      onPress: () => void linking.openUrl('https://thingsmatch.app'),
    },
    {
      id: 'diva',
      label: 'Ask DiVA',
      tile: <GradientFill angle={152} stops={SOFT_STOPS} />,
      // Web's diva.svg draws its glow with SVG filters, which the app's renderer lacks.
      icon: (
        <Image
          source={require('../../../../assets/images/natcycle-ai.png')}
          style={{ width: 52, height: 52, borderRadius: 26 }}
        />
      ),
      onPress: () => go('/ai'),
    },
    {
      id: 'where',
      label: 'Where',
      // The prototype leaves this tile empty: the map pin stands in until it has art.
      tile: <View style={{ ...tileBase, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#F8F8F8' }} />,
      icon: <MapPinGlyph color="#010B02" size={34} />,
      onPress: () => navigation.navigate(guest ? '/guest/where' : '/where'),
    },
    {
      id: 'events',
      label: 'Events',
      tile: <View style={{ ...tileBase, backgroundColor: '#C3F2C9' }} />,
      icon: <SvgXml xml={EVENTS_BIN_SVG} width={30} height={32} />,
      onPress: () => go('/campaigns'),
    },
    {
      id: 'snapdivert',
      label: 'SnapDivert',
      // #9ABDFF → #4CADE0, at about half strength.
      tile: (
        <GradientFill
          angle={180}
          stops={[
            { offset: 0, color: 'rgba(154,189,255,0.55)' },
            { offset: 1, color: 'rgba(76,173,224,0.48)' },
          ]}
        />
      ),
      icon: <SvgXml xml={SNAPDIVERT_SVG} width={51} height={41.9} />,
      onPress: () => go('/snapdivert'),
    },
  ];

  return (
    <ChromeScreen>
      <View style={{ marginHorizontal: -16, backgroundColor: '#F9FAF4', paddingBottom: 24 }}>
        <View style={{ height: 32, flexDirection: 'row', alignItems: 'center', paddingLeft: 31, paddingTop: 8 }}>
          <Pressable
            testID="waste-apps-back"
            accessibilityLabel="Back to home"
            onPress={() => navigation.navigate(guest ? '/guest/dashboard' : '/home')}
            style={{ width: 27 }}
          >
            <Text style={{ fontSize: 18, lineHeight: 22, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
              {'<'}
            </Text>
          </Pressable>
          <WasteAppsMark />
          <Text style={{ marginLeft: 13, fontSize: 18, lineHeight: 24, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
            Waste Apps
          </Text>
        </View>

        <Text style={{ alignSelf: 'center', marginTop: 64, maxWidth: 200, textAlign: 'center', fontSize: 18, lineHeight: 24, color: '#010B02' }}>
          Thinking of{'\n'}more <Text style={{ fontFamily: theme.font.bold }}>ways to divert?</Text>
        </Text>

        <View style={{ alignSelf: 'center', marginTop: 46, transform: [{ translateX: 3.1 }] }}>
          <SvgXml xml={WASTE_APPS_ILLUSTRATION_SVG} width={231.92} height={204.05} />
        </View>

        <View
          style={{
            alignSelf: 'center',
            marginTop: 40,
            width: '85%',
            maxWidth: 337,
            borderRadius: 42,
            backgroundColor: '#ffffff',
            paddingHorizontal: 27,
            paddingTop: 28,
            paddingBottom: 26,
          }}
        >
          <Text style={{ textAlign: 'center', fontSize: 16, lineHeight: 18, fontStyle: 'italic', color: '#707070' }}>
            explore
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 24, lineHeight: 28, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
            WasteApps
          </Text>
          <View style={{ marginTop: 34.5, flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 32 }}>
            {apps.map((app) => (
              <Pressable
                key={app.id}
                testID={`waste-app-${app.id}`}
                onPress={app.onPress}
                style={{ width: '28.5%', alignItems: 'center' }}
              >
                <View style={{ width: '100%', aspectRatio: 1, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={tileBase}>{app.tile}</View>
                  {app.icon}
                </View>
                <Text style={{ marginTop: 7, fontSize: 10, lineHeight: 12, color: '#000000', textAlign: 'center' }}>
                  {app.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <GuestSignInModal
        open={signIn}
        onClose={() => setSignIn(false)}
        message="Sign up to use this, free. Grocery scanning works without an account."
      />
    </ChromeScreen>
  );
}

import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CONSUMER_TABS,
  isTabLocked,
  type ConsumerTabId,
} from '@/core/navigation';
import { useTheme } from '@/shared/theme';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { NavHomeFilledGlyph, NavMapMarkerGlyph } from '@/shared/ui/icons/navBarGlyphs';
import { NavStarGlyph, NavUserGlyph } from '@/shared/ui/icons/navGlyphs';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Text } from '@/shared/ui/Text';

export function GlassTabBar({
  guest,
  activeId,
  collapsed,
  photoUrl,
  onToggle,
  onPressTab,
}: {
  guest: boolean;
  activeId: ConsumerTabId;
  collapsed: boolean;
  photoUrl?: string;
  onToggle: () => void;
  onPressTab: (id: ConsumerTabId) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(12, insets.bottom);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {collapsed ? (
        <Pressable
          testID="shell-nav-show"
          accessibilityRole="button"
          accessibilityLabel="Show navigation"
          onPress={onToggle}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            left: '50%',
            marginLeft: -theme.layout.navToggle / 2,
            bottom: Math.max(theme.space[5], insets.bottom + theme.space[5]),
            width: theme.layout.navToggle,
            height: theme.layout.navToggle,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.glass.toggle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronGlyph color="rgba(255,255,255,0.7)" direction="up" />
        </Pressable>
      ) : null}

      <View
        style={{
          paddingHorizontal: 39 / 2,
          transform: [{ translateY: collapsed ? 220 : 0 }],
        }}
      >
        <Pressable
          testID="shell-nav-hide"
          accessibilityRole="button"
          accessibilityLabel="Hide navigation"
          onPress={onToggle}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            left: '50%',
            marginLeft: -theme.layout.navToggle / 2,
            top: -theme.space[3],
            zIndex: 2,
            width: theme.layout.navToggle,
            height: theme.layout.navToggle,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.glass.toggle,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: collapsed ? 0 : 1,
          }}
        >
          <ChevronGlyph color="rgba(255,255,255,0.7)" direction="down" />
        </Pressable>

        {/* Web's MobileNav (new prototype): 39pt narrower than the screen, flush to the
            bottom, top corners only, white at 52% over a blur. Plain icons — #1E0D2A for
            the current page, #CCCCCC otherwise — and #707070 12pt labels. No discs. */}
        <GlassSurface
          testID="glass-tab-bar"
          style={{
            alignSelf: 'center',
            width: '100%',
            maxWidth: 511,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          contentStyle={{
            paddingTop: 9,
            paddingBottom: bottomPad,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'flex-start',
          }}
        >
          {CONSUMER_TABS.map((tab) => {
            const locked = isTabLocked(tab.id, guest);
            const active = tab.id === activeId && !locked;
            return (
              <Pressable
                key={tab.id}
                testID={`tab-${tab.id}`}
                accessibilityRole="button"
                accessibilityLabel={tab.name}
                accessibilityState={{ selected: active }}
                onPress={() => onPressTab(tab.id)}
                style={{ width: '25%', alignItems: 'center' }}
              >
                <View style={{ height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <TabGlyph
                    id={tab.id}
                    color={active ? '#1E0D2A' : '#CCCCCC'}
                    photoUrl={guest ? undefined : photoUrl}
                  />
                </View>
                <Text
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    lineHeight: 14,
                    color: '#707070',
                  }}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>
      </View>
    </View>
  );
}

function TabGlyph({
  id,
  color,
  photoUrl,
}: {
  id: ConsumerTabId;
  color: string;
  photoUrl?: string;
}) {
  if (id === 'home') return <NavHomeFilledGlyph color={color} />;
  if (id === 'impact') return <NavStarGlyph color={color} size={18} />;
  if (id === 'where') return <NavMapMarkerGlyph color={color} size={17} />;
  // "You" is the person's own photo, as on web.
  if (photoUrl) {
    return (
      <Image
        testID="tab-you-photo"
        source={{ uri: photoUrl }}
        style={{ width: 20, height: 20, borderRadius: 10 }}
      />
    );
  }
  return <NavUserGlyph color={color} size={16} />;
}

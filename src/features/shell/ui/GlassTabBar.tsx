import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CONSUMER_TABS,
  isTabLocked,
  type ConsumerTabId,
} from '@/core/navigation';
import { useTheme } from '@/shared/theme';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { MapPinGlyph } from '@/shared/ui/icons/featherGlyphs';
import {
  NavHomeGlyph,
  NavStarGlyph,
  NavUserGlyph,
} from '@/shared/ui/icons/navGlyphs';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Text } from '@/shared/ui/Text';

export function GlassTabBar({
  guest,
  activeId,
  collapsed,
  onToggle,
  onPressTab,
}: {
  guest: boolean;
  activeId: ConsumerTabId;
  collapsed: boolean;
  onToggle: () => void;
  onPressTab: (id: ConsumerTabId) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(theme.space[3], insets.bottom);

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
          paddingHorizontal: theme.layout.pagePadX,
          paddingBottom: bottomPad,
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

        {/* Real glassmorphism: web blurs the backdrop with
            `backdrop-filter: blur(20px) saturate(180%)` and paints
            rgba(255,255,255,0.55) over it. A flat translucent fill alone —
            which is what this was — never looks like glass. */}
        <GlassSurface
          testID="glass-tab-bar"
          style={{
            borderRadius: theme.layout.tabBarRadius,
            borderWidth: 1,
            borderColor: theme.glass.border,
            ...theme.shadow.glassNav,
          }}
          contentStyle={{
            paddingHorizontal: theme.space[2],
            paddingVertical: theme.space[3],
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
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
                onPress={() => onPressTab(tab.id)}
                style={{ flex: 1, alignItems: 'center' }}
              >
                <View
                  style={{
                    width: theme.layout.tabDisc,
                    height: theme.layout.tabDisc,
                    borderRadius: theme.radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                    backgroundColor: locked
                      ? theme.glass.discLocked
                      : active
                        ? theme.color.text
                        : theme.glass.discInactive,
                  }}
                >
                  <TabGlyph
                    id={tab.id}
                    color={locked ? '#9ca3af' : active ? '#ffffff' : '#4b5563'}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: theme.font.medium,
                    color: locked ? '#9ca3af' : active ? '#0f172a' : '#6b7280',
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

function TabGlyph({ id, color }: { id: ConsumerTabId; color: string }) {
  // Sizes come from dashboardNav.tsx: BiHome 20, FaStar 18, FiMapPin 20,
  // FaUser 18. Web mixes icon families here on purpose.
  if (id === 'home') return <NavHomeGlyph color={color} size={20} />;
  if (id === 'impact') return <NavStarGlyph color={color} size={18} />;
  if (id === 'where') return <MapPinGlyph color={color} size={20} />;
  return <NavUserGlyph color={color} size={18} />;
}

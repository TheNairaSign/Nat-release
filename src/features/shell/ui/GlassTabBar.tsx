import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CONSUMER_TABS,
  isTabLocked,
  type ConsumerTabId,
} from '@/core/navigation';
import { useTheme } from '@/shared/theme';
import {
  ChevronGlyph,
  HomeGlyph,
  PinGlyph,
  StarGlyph,
  UserGlyph,
} from '@/shared/ui/icons/glyphs';
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

        <View
          testID="glass-tab-bar"
          style={{
            borderRadius: theme.layout.tabBarRadius,
            paddingHorizontal: theme.space[2],
            paddingVertical: theme.space[3],
            borderWidth: 1,
            borderColor: theme.glass.border,
            backgroundColor: theme.glass.fill,
            ...theme.shadow.glassNav,
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
        </View>
      </View>
    </View>
  );
}

function TabGlyph({ id, color }: { id: ConsumerTabId; color: string }) {
  if (id === 'home') return <HomeGlyph color={color} />;
  if (id === 'impact') return <StarGlyph color={color} />;
  if (id === 'where') return <PinGlyph color={color} />;
  return <UserGlyph color={color} />;
}

import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { BrandLogo } from '@/shared/ui/BrandMark';
import { UserGlyph } from '@/shared/ui/icons/glyphs';
import { BellGlyph } from '@/shared/ui/icons/uiGlyphs';
import { WasteAppsMark } from '@/shared/ui/icons/WasteAppsMark';
import { Text } from '@/shared/ui/Text';

import aiOrb from '@/assets/brand/ai-orb.png';

export function ShellHeader({
  guest,
  hideAi,
  scrolled,
  onLogoPress,
  onAiPress,
  onNotificationsPress,
  onWasteAppsPress,
}: {
  guest: boolean;
  hideAi: boolean;
  scrolled: boolean;
  onLogoPress: () => void;
  onAiPress: () => void;
  onNotificationsPress?: () => void;
  /** Web's header: the four-square mark opens Waste Apps, before the DiVA orb. */
  onWasteAppsPress?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: theme.layout.appColumnMaxWidth,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.layout.pagePadX,
          paddingBottom: theme.space[3],
          paddingTop: Math.max(theme.space[3], insets.top),
          backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          ...(scrolled ? theme.shadow.sm : theme.shadow.none),
        }}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="NatCycle Logo"
          onPress={onLogoPress}
        >
          <BrandLogo height={theme.layout.headerLogoHeight} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {guest ? <GuestChip /> : null}
          {!guest && onNotificationsPress ? (
            <Pressable
              testID="shell-notifications"
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={onNotificationsPress}
              style={{ padding: 4 }}
            >
              <BellGlyph color={theme.color.ink} size={20} />
            </Pressable>
          ) : null}
          {onWasteAppsPress ? (
            <Pressable
              testID="shell-waste-apps"
              accessibilityRole="button"
              accessibilityLabel="Waste Apps"
              onPress={onWasteAppsPress}
              style={{ padding: 4 }}
            >
              <WasteAppsMark size={20} />
            </Pressable>
          ) : null}
          {hideAi ? null : (
            <Pressable
              testID="shell-ai"
              accessibilityRole="button"
              accessibilityLabel="AI Assistant"
              onPress={onAiPress}
              style={{ padding: 4 }}
            >
              <Image
                source={aiOrb}
                accessibilityLabel="AI Logo"
                style={{
                  width: theme.layout.aiOrb,
                  height: theme.layout.aiOrb,
                }}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function GuestChip() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[2],
        paddingHorizontal: theme.space[3],
        paddingVertical: 6,
        backgroundColor: theme.color.band,
        borderRadius: theme.radius.pill,
        marginRight: 4,
      }}
    >
      <View
        style={{
          width: theme.layout.guestAvatar,
          height: theme.layout.guestAvatar,
          borderRadius: theme.radius.pill,
          backgroundColor: '#9ca3af',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UserGlyph color="#ffffff" size={11} />
      </View>
      <Text
        variant="small"
        style={{ fontFamily: theme.font.medium, color: '#4b5563' }}
      >
        Guest
      </Text>
    </View>
  );
}

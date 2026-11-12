import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import {
  PROFILE_ACTIVITY,
  PROFILE_APP_VERSION,
  THINGSMATCH_APP_URL,
  avatarFallbackUrl,
  cuSaved,
  displayName,
} from '@/core/profile';
import {
  fetchProfileUser,
  profileUserQueryKey,
  updateProfilePhoto,
} from '../api/profile-api';
import { CameraGlyph } from '@/shared/ui/icons/featherGlyphs';
import { useSession } from '@/features/auth';
import { TokensStat, useAllowance } from '@/features/tokens';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text, ThingsMatchMark } from '@/shared/ui';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { BasketGlyph } from '@/shared/ui/icons/groceryGlyphs';
import {
  BoltGlyph,
  BullhornGlyph,
  ChartPieGlyph,
  CogGlyph,
  LocationSearchingGlyph,
  SignOutGlyph,
} from '@/shared/ui/icons/uiGlyphs';
import { NavMapMarkerGlyph } from '@/shared/ui/icons/navBarGlyphs';

/** Past this long the page shows anyway (web Profile.tsx LOAD_LIMIT_MS). */
const LOAD_LIMIT_MS = 4000;

function ActivityIcon({
  icon,
  color,
}: {
  icon: (typeof PROFILE_ACTIVITY)[number]['icon'];
  color: string;
}) {
  switch (icon) {
    // Sizes from Profile.tsx: FaBolt 18, FaBullhorn 18, MdOutlineLocationSearching 20.
    case 'bolt':
      return <BoltGlyph color={color} size={18} />;
    case 'bullhorn':
      return <BullhornGlyph color={color} size={18} />;
    // FaShoppingBasket 18
    case 'basket':
      return <BasketGlyph color={color} size={18} />;
    // FaMapMarkerAlt 18
    case 'pin':
      return <NavMapMarkerGlyph color={color} size={18} />;
    default:
      return <LocationSearchingGlyph color={color} size={20} />;
  }
}

export function ProfileScreen() {
  const theme = useTheme();
  const { http, navigation, camera, linking } = usePorts();
  const { persist } = useSession();
  const query = useQuery({
    queryKey: profileUserQueryKey,
    queryFn: () => fetchProfileUser(http),
  });
  const user = query.data;
  const name = displayName(user?.firstName, user?.lastName);
  const photo = user?.profilePictureUrl || avatarFallbackUrl(name);

  // The page appears in one go, as on web: the photo and the token count first, then
  // everything together (or after LOAD_LIMIT_MS, whichever comes first).
  const { allowance, settled: tokensSettled } = useAllowance();
  const [pictureReady, setPictureReady] = useState(false);
  const [gaveUpWaiting, setGaveUpWaiting] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUpWaiting(true), LOAD_LIMIT_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!user) return;
    let live = true;
    // A picture that can't be fetched ahead never holds the page back.
    Promise.resolve()
      .then(() => Image.prefetch(photo))
      .catch(() => false)
      .finally(() => live && setPictureReady(true));
    return () => {
      live = false;
    };
  }, [user, photo]);

  async function onPhoto() {
    const picked = await camera.pickImage();
    if (!picked?.base64) return;
    const mime = picked.mimeType || 'image/jpeg';
    await updateProfilePhoto(http, `data:${mime};base64,${picked.base64}`);
    await query.refetch();
  }

  if (!user || (!(tokensSettled && pictureReady) && !gaveUpWaiting)) {
    return <ProfileSkeleton />;
  }

  return (
    <ChromeScreen>
      <View style={{ alignItems: 'center', marginBottom: 20, paddingTop: 8 }}>
        <Pressable testID="profile-photo" onPress={() => void onPhoto()}>
          <Image
            source={{ uri: photo }}
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.06)',
            }}
          />
          {/* web: `absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#111111]
              text-white border-2 border-white` with FiCamera at 16 */}
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#111111',
              borderWidth: 2,
              borderColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CameraGlyph color="#ffffff" size={16} />
          </View>
        </Pressable>
        <Text
          style={{
            fontSize: 24,
            fontFamily: theme.font.bold,
            marginTop: 12,
            color: '#111111',
          }}
        >
          {name}
        </Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>
          {user.email}
        </Text>
      </View>
      {/* web: one card, `flex items-stretch justify-between rounded-2xl px-4 py-4`:
          CU saved on the left, AI tokens on the right */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <ChartPieGlyph color="#B8E83A" size={22} />
          <Text
            style={{
              fontSize: 24,
              lineHeight: 24,
              fontFamily: theme.font.bold,
              marginTop: 12,
              color: '#111111',
            }}
          >
            {cuSaved(user.carbonUnits)}
          </Text>
          <Text variant="small" muted style={{ marginTop: 6 }}>
            CU Saved
          </Text>
        </View>
        <TokensStat
          allowance={allowance}
          onPress={() => navigation.navigate('/tokens')}
        />
      </View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: theme.font.semibold,
          color: theme.color.placeholder,
          letterSpacing: 1,
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        Activity
      </Text>
      {PROFILE_ACTIVITY.map((row) => (
        <Pressable
          key={row.id}
          testID={`profile-${row.id}`}
          onPress={() => navigation.navigate(row.href)}
          style={{
            minHeight: 56,
            borderRadius: theme.radius.lg,
            paddingHorizontal: 14,
            paddingVertical: 14,
            marginBottom: 10,
            backgroundColor: row.highlight ? '#E8F9C8' : theme.color.surface,
            borderWidth: 1,
            borderColor: row.highlight
              ? 'rgba(209,255,82,0.6)'
              : 'rgba(0,0,0,0.04)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: row.highlight
                  ? 'rgba(255,255,255,0.7)'
                  : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIcon icon={row.icon} color="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: theme.font.semibold,
                  fontSize: 15,
                  color: '#111111',
                }}
              >
                {row.title}
              </Text>
              <Text variant="small" muted style={{ marginTop: 2 }}>
                {row.subtitle}
              </Text>
            </View>
          </View>
          <ChevronGlyph
            color={theme.color.placeholder}
            size={14}
            direction="right"
          />
        </Pressable>
      ))}
      <Text
        style={{
          fontSize: 11,
          fontFamily: theme.font.semibold,
          color: theme.color.placeholder,
          letterSpacing: 1,
          marginTop: 16,
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        Account Settings
      </Text>
      <Pressable
        testID="profile-update"
        onPress={() => navigation.navigate('/profile/update-profile')}
        style={settingsRow(theme)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={iconWell}>
            <CogGlyph color="#475569" size={18} />
          </View>
          <Text
            style={{
              fontFamily: theme.font.semibold,
              fontSize: 15,
              color: '#111111',
            }}
          >
            Update Profile
          </Text>
        </View>
        <ChevronGlyph
          color={theme.color.placeholder}
          size={14}
          direction="right"
        />
      </Pressable>
      <Pressable
        testID="profile-logout"
        onPress={() => {
          void persist(null).then(() => navigation.replace('/sign-in'));
        }}
        style={{ ...settingsRow(theme), marginBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ ...iconWell, backgroundColor: '#fef2f2' }}>
            <SignOutGlyph color="#ef4444" size={18} />
          </View>
          <Text
            style={{
              fontFamily: theme.font.semibold,
              fontSize: 15,
              color: '#ef4444',
            }}
          >
            Logout
          </Text>
        </View>
        <ChevronGlyph color="#fca5a5" size={14} direction="right" />
      </Pressable>
      <Pressable
        testID="profile-thingsmatch"
        onPress={() => {
          void linking.openUrl(THINGSMATCH_APP_URL);
        }}
        style={{
          backgroundColor: theme.color.ink,
          borderRadius: theme.radius.md,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <ThingsMatchMark />
        <Text
          style={{
            color: theme.color.accentText,
            fontFamily: theme.font.semibold,
          }}
        >
          Open ThingsMatch App
        </Text>
      </Pressable>
      <Text
        variant="caption"
        muted
        style={{ textAlign: 'center', marginTop: 16 }}
      >
        App Version {PROFILE_APP_VERSION}
      </Text>
    </ChromeScreen>
  );
}

const iconWell = {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#f1f5f9',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

function settingsRow(theme: ReturnType<typeof useTheme>) {
  return {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  };
}

function Block({ style }: { style: object }) {
  return <View style={[{ backgroundColor: '#EEF2EC' }, style]} />;
}

/** The profile's shape while it loads (web ProfileSkeleton.tsx), so nothing moves. */
function ProfileSkeleton() {
  return (
    <ChromeScreen>
      <View
        testID="profile-skeleton"
        accessibilityLabel="Loading your profile"
        style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 20 }}
      >
        <Block style={{ marginBottom: 12, width: 128, height: 128, borderRadius: 64 }} />
        <Block style={{ width: 176, height: 32, borderRadius: 8 }} />
        <Block style={{ marginTop: 8, width: 208, height: 16, borderRadius: 6 }} />
      </View>
      <Block style={{ marginBottom: 24, height: 121, borderRadius: 16 }} />
      <Block style={{ marginBottom: 10, width: 64, height: 12, borderRadius: 4 }} />
      <View style={{ marginBottom: 24, gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <Block key={i} style={{ height: 72, borderRadius: 16 }} />
        ))}
      </View>
      <Block style={{ marginBottom: 10, width: 112, height: 12, borderRadius: 4 }} />
      <View style={{ gap: 10 }}>
        {[0, 1].map((i) => (
          <Block key={i} style={{ height: 66, borderRadius: 16 }} />
        ))}
      </View>
    </ChromeScreen>
  );
}

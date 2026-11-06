import { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { buildFoodCardOpening } from '@/core/grocery';
import { aiHref, impactMeter, whereHref } from '@/core/home';
import {
  DROPOFF_SUCCESS_KEY,
  type DropoffSuccessPayload,
} from '@/core/dropoff';
import { disposeChipsOrFallback } from '@/core/materials';
import { isCoveredPosition } from '@/core/where';
import { openDivaWith } from '@/features/ai';
import {
  fetchActiveGroceries,
  fetchDisposeChips,
  fetchHomeProfile,
  homeGroceriesQueryKey,
  homeMaterialsQueryKey,
  homeProfileQueryKey,
  requestHomeOtp,
} from '../api/home-api';
import { AskDivaBox } from '../ui/AskDivaBox';
import { DropoffSuccessModal } from '../ui/DropoffSuccessModal';
import { HomeActionCards } from '../ui/HomeActionCards';
import { HomeMeter } from '../ui/HomeMeter';
import { HomeNoticeBanner } from '../ui/HomeNoticeBanner';
import { SafariBanner } from '../ui/SafariBanner';
import { WasteAppsRow } from '../ui/WasteAppsRow';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';

/** Past this long Home shows anyway (web Dashboard LOAD_LIMIT_MS). */
const LOAD_LIMIT_MS = 8000;

/** 47pt from the meter to the cards on the prototype's 852-tall screen; less when shorter. */
const METER_GAP = Math.min(47, Math.max(20, Dimensions.get('window').height * 0.055));

/**
 * Home, from the prototype (HOME – ActionSlide1 – 8, Nov 2) via web Dashboard.tsx: the
 * meter, the two action cards, the waste apps row and "ask Diva". Everything appears
 * together once the profile, materials, groceries and location are in, so nothing
 * shifts as each arrives.
 */
export function HomeScreen({
  guest = false,
  onRequireSignIn,
}: {
  guest?: boolean;
  onRequireSignIn?: () => void;
}) {
  const theme = useTheme();
  const { http, navigation, kv, location, linking } = usePorts();
  const [selected, setSelected] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState<DropoffSuccessPayload | null>(null);
  const [gaveUpWaiting, setGaveUpWaiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGaveUpWaiting(true), LOAD_LIMIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await kv.get<DropoffSuccessPayload | string>(DROPOFF_SUCCESS_KEY);
      if (!raw || cancelled) return;
      await kv.remove(DROPOFF_SUCCESS_KEY);
      try {
        const parsed =
          typeof raw === 'string' ? (JSON.parse(raw) as DropoffSuccessPayload) : raw;
        if (!cancelled) setSuccess(parsed);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kv]);

  const profileQuery = useQuery({
    queryKey: homeProfileQueryKey,
    queryFn: () => fetchHomeProfile(http),
    enabled: !guest,
  });
  const materialsQuery = useQuery({
    queryKey: homeMaterialsQueryKey,
    queryFn: () => fetchDisposeChips(http),
  });
  const groceriesQuery = useQuery({
    queryKey: homeGroceriesQueryKey,
    queryFn: () => fetchActiveGroceries(http),
    enabled: !guest,
  });
  // Home never asks for location: it only uses what's already allowed (web
  // fetchWhereCoverage). Null when we don't know where they are.
  const coverageQuery = useQuery({
    queryKey: ['home', 'coverage'],
    queryFn: async () => {
      const here = await location.getCurrentPosition().catch(() => null);
      return here ? (isCoveredPosition(here) ? 'covered' : 'outside') : null;
    },
  });

  const profile = profileQuery.data;
  const chips = disposeChipsOrFallback(materialsQuery.data ?? []);
  const meter = impactMeter(guest ? 0 : (profile?.carbonUnits ?? 0));
  const groceries = guest ? [] : (groceriesQuery.data ?? null);

  const loading =
    materialsQuery.isPending ||
    (!guest && profileQuery.isPending) ||
    groceries === null ||
    coverageQuery.isPending;
  if (loading && !gaveUpWaiting) {
    return (
      <ChromeScreen>
        <View testID="home-skeleton" style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 120, height: 17, borderRadius: 6, backgroundColor: '#EEF2EC' }} />
          <View style={{ marginTop: 4, width: 298, height: 30, borderRadius: 15, backgroundColor: '#EEF2EC' }} />
          <View style={{ marginTop: METER_GAP + 18, width: '92%', height: 230, borderRadius: 39, backgroundColor: '#EEF2EC' }} />
        </View>
      </ChromeScreen>
    );
  }

  /** Signed-out visitors are asked to sign in for what needs an account. */
  function lockOrGo(href: string) {
    if (guest) {
      onRequireSignIn?.();
      return;
    }
    navigation.navigate(href);
  }

  async function onVerify() {
    setOtpError('');
    const ok = await requestHomeOtp(http);
    if (!ok) {
      setOtpError('Failed to send verification code. Please try again.');
      return;
    }
    navigation.navigate('/verify-email');
  }

  return (
    <ChromeScreen>
      <SafariBanner />
      <HomeMeter
        guest={guest}
        meter={meter}
        onImpact={() => navigation.navigate('/impact')}
        onOpenUrl={(url) => void linking.openUrl(url)}
      />
      <View style={{ height: METER_GAP }} />
      <HomeActionCards
        guest={guest}
        materialsLoading={materialsQuery.isPending}
        materials={chips}
        selectedMaterial={selected}
        onSelectMaterial={(item) => setSelected((current) => (current === item ? null : item))}
        groceries={groceries}
        outsideCoverage={coverageQuery.data === 'outside'}
        onAskHowTo={(question) => lockOrGo(aiHref(question))}
        onFindWhere={(material) => navigation.navigate(whereHref(guest, material))}
        onAskAboutGroceries={(items) => {
          // DiVA opens with the choices for the picked food.
          openDivaWith(buildFoodCardOpening(items));
          navigation.navigate('/ai');
        }}
        onNavigate={(href) => navigation.navigate(href)}
        // Guests can scan too; the scanner asks them to sign up afterwards.
        onStartScanning={() => navigation.navigate(guest ? '/guest/ai/grocery' : '/ai/grocery')}
      />
      <WasteAppsRow
        groceries={groceries}
        // The list if there is one, else a scan (web groceryEntryPath).
        onGrocery={() =>
          guest
            ? navigation.navigate('/guest/ai/grocery')
            : groceries && groceries.length > 0
              ? navigation.navigate('/grocery/history')
              : navigation.navigate('/ai/grocery')
        }
        onSnapDivert={() => navigation.navigate(guest ? '/guest/snapdivert' : '/snapdivert')}
        onWhere={() => navigation.navigate(guest ? '/guest/where' : '/where')}
        onEvents={() => lockOrGo('/campaigns')}
      />
      <AskDivaBox onAsk={(question) => lockOrGo(aiHref(question || undefined))} />
      {!guest && profile?.ready && !profile.isEmailVerified ? (
        <HomeNoticeBanner
          title="Verify your email"
          body="Please verify your email to unlock all features."
          action="Verify Email Now →"
          onPress={() => {
            void onVerify();
          }}
        />
      ) : null}
      {otpError ? (
        <Text variant="small" style={{ color: theme.color.danger, marginTop: 8 }}>
          {otpError}
        </Text>
      ) : null}
      {!guest && profile?.ready && !profile.phoneNumber ? (
        <HomeNoticeBanner
          title="Complete your profile"
          body="Update your phone number to get notified about your pickups."
          action="Update Phone Number →"
          onPress={() => navigation.navigate('/profile/update-profile')}
        />
      ) : null}
      <DropoffSuccessModal payload={success} onClose={() => setSuccess(null)} />
    </ChromeScreen>
  );
}

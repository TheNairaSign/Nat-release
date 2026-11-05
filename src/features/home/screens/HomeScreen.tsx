import { useEffect, useState } from 'react';

import { aiHref, homeGreeting, impactMeter, whereHref } from '@/core/home';
import {
  DROPOFF_SUCCESS_KEY,
  type DropoffSuccessPayload,
} from '@/core/dropoff';
import { disposeChipsOrFallback } from '@/core/materials';
import {
  fetchAiSuggestions,
  fetchDisposeChips,
  fetchHomeProfile,
  homeMaterialsQueryKey,
  homeProfileQueryKey,
  homeSuggestionsQueryKey,
  requestHomeOtp,
  type HomeSuggestion,
} from '../api/home-api';
import { AiDash } from '../ui/AiDash';
import { DropoffSuccessModal } from '../ui/DropoffSuccessModal';
import { DisposeCard } from '../ui/DisposeCard';
import { GreenImpactCard } from '../ui/GreenImpactCard';
import { HomeNoticeBanner } from '../ui/HomeNoticeBanner';
import { SafariBanner } from '../ui/SafariBanner';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';

export function HomeScreen({
  guest = false,
  onRequireSignIn,
}: {
  guest?: boolean;
  onRequireSignIn?: () => void;
}) {
  const theme = useTheme();
  const { http, navigation, clock, kv } = usePorts();
  const [selected, setSelected] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState<DropoffSuccessPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await kv.get<DropoffSuccessPayload | string>(
        DROPOFF_SUCCESS_KEY,
      );
      if (!raw || cancelled) return;
      await kv.remove(DROPOFF_SUCCESS_KEY);
      try {
        const parsed =
          typeof raw === 'string'
            ? (JSON.parse(raw) as DropoffSuccessPayload)
            : raw;
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
  const suggestionsQuery = useQuery({
    queryKey: homeSuggestionsQueryKey,
    queryFn: () => fetchAiSuggestions(http),
  });

  const profile = profileQuery.data;
  const chips = disposeChipsOrFallback(materialsQuery.data ?? []);
  const meter = impactMeter(guest ? 0 : (profile?.carbonUnits ?? 0));
  const greeting = homeGreeting(
    clock.now().getHours(),
    guest,
    guest ? undefined : profile?.firstName,
  );

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
      <GreenImpactCard guest={guest} meter={meter} />
      <DisposeCard
        greeting={greeting}
        loading={materialsQuery.isPending}
        chips={chips}
        selected={selected}
        onSelect={(item) =>
          setSelected((current) => (current === item ? null : item))
        }
        onFindWhere={() => navigation.navigate(whereHref(guest, selected))}
      />
      <AiDash
        loading={suggestionsQuery.isPending}
        suggestions={suggestionsQuery.data ?? []}
        onOpenChat={() => lockOrGo('/ai')}
        onSuggestion={(item: HomeSuggestion) =>
          lockOrGo(aiHref(item.text, item.id))
        }
      />
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
        <Text
          variant="small"
          style={{ color: theme.color.danger, marginTop: 8 }}
        >
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

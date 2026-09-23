import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import {
  actionMapPoints,
  calculateUserContributions,
  dayCounts,
  impactStats,
  impactUnitForCard,
  sinceLabel,
  uniqueActiveDays,
} from '@/core/impact';
import {
  fetchImpactActivities,
  fetchImpactCatalog,
  fetchImpactUser,
  impactDropoffsQueryKey,
  impactMaterialsQueryKey,
  impactUserQueryKey,
} from '../api/impact-api';
import { useSession } from '@/features/auth';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';
import { ImpactBreakdownCard } from '../ui/ImpactBreakdownCard';
import { impactShareText } from '@/core/dropoff';
import { SnapCarousel } from '@/shared/ui/SnapCarousel';
import { ImpactActionMapCard } from '../ui/ImpactActionMapCard';
import { ImpactGreenCommitsCard } from '../ui/ImpactGreenCommitsCard';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

export function ImpactScreen() {
  const theme = useTheme();
  const { http, navigation, share } = usePorts();
  const { session } = useSession();
  const userId = session?.userId ?? '';
  const [tab, setTab] = useState<'commits' | 'map'>('commits');
  const profileQuery = useQuery({
    queryKey: impactUserQueryKey,
    queryFn: () => fetchImpactUser(http),
  });
  const dropoffsQuery = useQuery({
    queryKey: [...impactDropoffsQueryKey, userId],
    queryFn: () => fetchImpactActivities(http, userId),
    enabled: Boolean(userId),
  });
  const catalogQuery = useQuery({
    queryKey: impactMaterialsQueryKey,
    queryFn: () => fetchImpactCatalog(http),
  });
  const user = profileQuery.data;
  const activities = dropoffsQuery.data ?? [];
  const stats = impactStats(activities, user?.carbonUnits ?? 0);
  const contributions = calculateUserContributions(
    activities.filter((item) => item.kind !== 'simple'),
    user?.itemsCount ?? {},
    catalogQuery.data?.types ?? [],
    catalogQuery.data?.materials ?? [],
  );
  // No zero-row filter: web seeds every catalog material at zero and renders
  // `materialContributions.slice(0, 4)` unfiltered (Impact.tsx), so materials
  // you have not dropped off yet — glass, paper — still appear. Filtering them
  // out left only materials with data, which is why the breakdown collapsed to
  // a single card. The See-all screen never had this filter, which is why it
  // still listed every type.
  const year = new Date().getFullYear();
  const counts = dayCounts(activities);
  const days = uniqueActiveDays(activities, year);
  const actionPoints = actionMapPoints(activities);
  const initials = (user?.firstName?.[0] ?? 'N') + (user?.lastName?.[0] ?? '');

  if (profileQuery.isPending && !user) {
    return (
      <ChromeScreen>
        <Text>Loading user data...</Text>
      </ChromeScreen>
    );
  }

  return (
    <ChromeScreen>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {user?.profilePictureUrl ? (
          <Image
            source={{ uri: user.profilePictureUrl }}
            style={{ width: 64, height: 64, borderRadius: 32 }}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#D1FF52',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: theme.font.bold, fontSize: 20 }}>
              {initials}
            </Text>
          </View>
        )}
        <Text
          style={{ fontSize: 18, fontFamily: theme.font.medium, marginTop: 12 }}
        >
          {user?.firstName} {user?.lastName}
        </Text>
        {sinceLabel(user?.createdAt) ? (
          <Text variant="small" muted style={{ marginTop: 4 }}>
            {sinceLabel(user?.createdAt)}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: theme.color.ink,
          borderRadius: theme.radius.pill,
          flexDirection: 'row',
          paddingVertical: 16,
          paddingHorizontal: 16,
          marginBottom: 20,
        }}
      >
        <Pressable
          testID="impact-dropoffs"
          onPress={() => navigation.navigate('/dropoff/all')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text
            style={{ color: '#fff', fontSize: 20, fontFamily: theme.font.bold }}
          >
            {stats.dropoffs}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            drop-off
          </Text>
        </Pressable>
        <Pressable
          testID="impact-events"
          onPress={() => navigation.navigate('/campaigns')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text
            style={{ color: '#fff', fontSize: 20, fontFamily: theme.font.bold }}
          >
            {stats.events}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            events
          </Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{ color: '#fff', fontSize: 20, fontFamily: theme.font.bold }}
          >
            {stats.bcu}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            CU
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: theme.font.medium, marginBottom: 12 }}>
        Breakdown
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        }}
      >
        {contributions.slice(0, 4).map((row) => (
          <View key={row.materialType} style={{ width: '48%' }}>
            <ImpactBreakdownCard
              label={row.label}
              quantity={row.totalQuantity}
              unitLabel={impactUnitForCard(row.materialType)}
              carbonUnits={row.carbonUnits}
              materialType={row.materialType}
            />
          </View>
        ))}
      </View>
      <Pressable
        testID="impact-see-all"
        onPress={() => navigation.navigate('/material-contributions')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: 16,
          gap: 2,
        }}
      >
        <Text style={{ fontSize: 12, color: '#1B4332' }}>See all</Text>
        <ChevronGlyph color="#1B4332" size={12} direction="right" />
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
        <Pressable onPress={() => setTab('commits')}>
          <Text
            style={{
              fontSize: 16,
              color:
                tab === 'commits' ? theme.color.ink : theme.color.placeholder,
            }}
          >
            Green Commits
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab('map')}>
          <Text
            style={{
              fontSize: 16,
              color: tab === 'map' ? theme.color.ink : theme.color.placeholder,
            }}
          >
            Action Map
          </Text>
        </Pressable>
      </View>
      {/* Web pairs the tab labels with a SnapCardCarousel holding BOTH cards
          (Impact.tsx:252-266) — swipeable, snapping, with the next card
          peeking. Mobile swapped a single card on tab press, so there was no
          carousel, no swipe and no peek. */}
      <SnapCarousel
        activeIndex={tab === 'commits' ? 0 : 1}
        onActiveIndexChange={(index) => setTab(index === 0 ? 'commits' : 'map')}
        cardWidthRatio={0.92}
        padLeft={4}
        gap={12}
      >
        {[
          <ImpactGreenCommitsCard
            key="commits"
            counts={counts}
            activeDays={days}
            totalDiversions={activities.length}
            allTimeCarbonUnits={user?.carbonUnits ?? 0}
          />,
          <ImpactActionMapCard
            key="map"
            points={actionPoints}
            loading={dropoffsQuery.isPending}
          />,
        ]}
      </SnapCarousel>
      <Pressable
        testID="impact-share"
        onPress={() => {
          void share.share(
            impactShareText(stats.dropoffs + stats.events, user?.carbonUnits ?? 0),
          );
        }}
        style={{
          alignSelf: 'flex-end',
          marginTop: 16,
          backgroundColor: '#1B5E20',
          borderRadius: theme.radius.pill,
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.semibold }}>
          Share commit
        </Text>
      </Pressable>
    </ChromeScreen>
  );
}

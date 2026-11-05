import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import {
  NO_HOME_DIVERSION,
  actionMapPoints,
  breakdownUnit,
  calculateUserContributions,
  dayCounts,
  impactPill,
  sinceLabel,
  totalCarbonUnits,
  uniqueActiveDays,
  withHomeDiversion,
} from '@/core/impact';
import {
  fetchHomeDiversion,
  fetchImpactActivities,
  fetchImpactCatalog,
  fetchImpactUser,
  homeDiversionQueryKey,
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

/** web: auto-cols-[145px], two rows, gap-x-[13px] gap-y-[18px], px-[21px] bleeding out. */
const CARD_W = 145;
const CARD_GAP_X = 13;
const CARD_GAP_Y = 18;
const CU_EXPLAINER_URL = 'https://www.natcycle.com/carbon-unit';

export function ImpactScreen() {
  const theme = useTheme();
  const { http, navigation, share, linking } = usePorts();
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
  // Food used from the Grocery Manager and things SnapDivert diverted.
  const homeQuery = useQuery({
    queryKey: homeDiversionQueryKey,
    queryFn: () => fetchHomeDiversion(http),
  });
  const user = profileQuery.data;
  const activities = dropoffsQuery.data ?? [];
  const home = homeQuery.data;
  const stats = impactPill(activities, home ?? NO_HOME_DIVERSION, user);
  const contributions = home
    ? withHomeDiversion(
        calculateUserContributions(
          activities.filter((item) => item.kind !== 'simple'),
          user?.itemsCount ?? {},
          catalogQuery.data?.types ?? [],
          catalogQuery.data?.materials ?? [],
        ),
        home,
      )
    : [];
  const breakdownLoading = catalogQuery.isPending || homeQuery.isPending;
  // Two rows that scroll sideways, filled column by column (web grid-flow-col).
  const cards = contributions.slice(0, 8);
  const columns: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += 2) columns.push(cards.slice(i, i + 2));
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

  const pillValue = { color: '#fff', fontSize: 20, lineHeight: 22, fontFamily: theme.font.bold };
  const pillLabel = { color: '#94a3b8', fontSize: 12, marginTop: 4 };

  return (
    <ChromeScreen>
      {/* Prototype Flow 3 (HOME – 45): 32pt avatar, 18 bold name, "Since" 12 */}
      <View style={{ alignItems: 'center', paddingTop: 17 }}>
        {user?.profilePictureUrl ? (
          <Image
            source={{ uri: user.profilePictureUrl }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#D1FF52',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: theme.font.bold, fontSize: 12, color: '#000' }}>
              {initials}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 18, lineHeight: 22, fontFamily: theme.font.bold, color: '#010B02' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        {sinceLabel(user?.createdAt) ? (
          <Text style={{ fontSize: 12, lineHeight: 14, color: '#1C0F28' }}>
            {sinceLabel(user?.createdAt)}
          </Text>
        ) : null}
      </View>

      {/* web: mt-[27px] bg-[#111111] rounded-full px-4 py-4, three columns */}
      <View
        style={{
          marginTop: 27,
          backgroundColor: '#111111',
          borderRadius: 999,
          flexDirection: 'row',
          paddingVertical: 16,
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          testID="impact-dropoffs"
          onPress={() => navigation.navigate('/dropoff/all')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text style={pillValue}>{stats.dropoffs}</Text>
          <Text style={pillLabel}>drop-off</Text>
        </Pressable>
        {/* Kept out of landfill at home: food used, things SnapDivert diverted. */}
        <Pressable
          testID="impact-home"
          onPress={() => navigation.navigate('/waste-apps')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text style={pillValue}>{stats.home}</Text>
          <Text style={pillLabel}>home diversion</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={pillValue}>{stats.bcu}</Text>
          <Text style={pillLabel}>CU</Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 44,
          paddingHorizontal: 8,
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 16, fontFamily: theme.font.medium, color: '#1E0D2A' }}>
          Material Breakdown
        </Text>
        <Pressable testID="impact-see-all" onPress={() => navigation.navigate('/material-contributions')}>
          <Text style={{ fontSize: 16, fontStyle: 'italic', color: '#1E0D2A' }}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 13, marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 21, gap: CARD_GAP_X }}
      >
        {breakdownLoading
          ? [0, 1, 2].map((col) => (
              <View key={col} style={{ gap: CARD_GAP_Y }}>
                {[0, 1].map((row) => (
                  <View
                    key={row}
                    style={{ width: CARD_W, height: 88, borderRadius: 20, backgroundColor: '#F3FBFB' }}
                  />
                ))}
              </View>
            ))
          : columns.map((column, i) => (
              <View key={i} style={{ gap: CARD_GAP_Y }}>
                {column.map((row) => (
                  <ImpactBreakdownCard
                    key={row.materialType}
                    width={CARD_W}
                    label={row.label}
                    quantity={row.totalQuantity}
                    unitLabel={breakdownUnit(row.materialType)}
                    carbonUnits={row.carbonUnits}
                  />
                ))}
              </View>
            ))}
      </ScrollView>

      <View style={{ marginTop: 52 }} />
      {/* web: gap-[43px] px-1.5 text-[18px] text-[#1E0D2A], the active one bold */}
      <View style={{ flexDirection: 'row', gap: 43, paddingHorizontal: 6, marginBottom: 30 }}>
        {(
          [
            ['commits', 'Green Commits'],
            ['map', 'Action Map'],
          ] as const
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setTab(key)}>
            <Text
              style={{
                fontSize: 18,
                color: '#1E0D2A',
                fontFamily: tab === key ? theme.font.bold : theme.font.regular,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
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
            allTimeCarbonUnits={totalCarbonUnits(user)}
          />,
          <ImpactActionMapCard
            key="map"
            points={actionPoints}
            loading={dropoffsQuery.isPending}
          />,
        ]}
      </SnapCarousel>
      {/* web: mt-[64px] centred, h-[47px] rounded-full bg-[#356A2E] px-[23px] 16 bold */}
      <Pressable
        testID="impact-share"
        onPress={() => {
          void share.share(
            impactShareText(activities.length, totalCarbonUnits(user)),
          );
        }}
        style={{
          alignSelf: 'center',
          marginTop: 64,
          height: 47,
          justifyContent: 'center',
          backgroundColor: '#356A2E',
          borderRadius: 999,
          paddingHorizontal: 23,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontFamily: theme.font.bold }}>
          Share commit
        </Text>
      </Pressable>

      <View style={{ marginTop: 90, paddingHorizontal: 6, paddingBottom: 24 }}>
        <Text style={{ fontSize: 16, fontFamily: theme.font.medium, color: '#1E0D2A' }}>
          CU is Carbon Units
        </Text>
        <Pressable onPress={() => void linking.openUrl(CU_EXPLAINER_URL)}>
          <Text
            style={{
              marginTop: 4,
              maxWidth: 296,
              fontSize: 10,
              lineHeight: 12,
              color: '#B1B1B1',
              textDecorationLine: 'underline',
            }}
          >
            Measure is based on EPA iWARM standard. Read more on carbon cards and carbon units
          </Text>
        </Pressable>
      </View>
    </ChromeScreen>
  );
}

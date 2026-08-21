import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import {
  ACTION_MAP_CENTER,
  calculateUserContributions,
  dayCounts,
  impactStats,
  impactUnitForCard,
  sinceLabel,
  uniqueActiveDays,
  yearHeatCells,
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
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { WhereMap } from '@/shared/ui/maps/WhereMap';

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
  ).filter((row) => row.totalDropoffs > 0 || row.totalQuantity > 0);
  const year = new Date().getFullYear();
  const counts = dayCounts(activities);
  const cells = yearHeatCells(year, counts);
  const days = uniqueActiveDays(activities, year);
  const mapMarkers = activities
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => ({
      id: item.id,
      lat: item.lat ?? 0,
      lng: item.lng ?? 0,
      selected: false,
    }));
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
          <View
            key={row.materialType}
            style={{
              width: '48%',
              backgroundColor: theme.color.lime,
              borderRadius: theme.radius.lg,
              padding: 16,
              minHeight: 100,
            }}
          >
            <Text style={{ fontFamily: theme.font.semibold }}>{row.label}</Text>
            <Text>
              {Math.round(row.totalQuantity)}{' '}
              {impactUnitForCard(row.materialType)}
            </Text>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 8,
                backgroundColor: theme.color.ink,
                borderRadius: theme.radius.pill,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text variant="small" style={{ color: theme.color.accentText }}>
                {Math.round(row.carbonUnits)} CU
              </Text>
            </View>
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
      {tab === 'commits' ? (
        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card28,
            borderWidth: 1,
            borderColor: theme.color.borderSolid,
            padding: 16,
            minHeight: 440,
          }}
        >
          <Text variant="small" muted>
            {days} waste diversions in {year}
          </Text>
          <View
            style={{
              height: 24,
              backgroundColor: theme.color.limeTrack,
              borderRadius: 8,
              marginVertical: 8,
            }}
          >
            <View
              style={{
                width: `${Math.min(100, (days / 365) * 100)}%`,
                height: '100%',
                backgroundColor: theme.color.ink,
                borderRadius: 8,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
            {cells.map((cell) => (
              <View
                key={cell.key}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  backgroundColor:
                    cell.level === 0
                      ? theme.color.heatEmpty
                      : cell.level === 1
                        ? theme.color.heatLow
                        : cell.level === 2
                          ? theme.color.heatMid
                          : theme.color.commitFill,
                }}
              />
            ))}
          </View>
          <Text variant="small" style={{ marginTop: 12 }}>
            All time: {Math.floor(user?.carbonUnits ?? 0).toLocaleString()}CU
          </Text>
        </View>
      ) : (
        <View
          style={{
            height: 440,
            borderRadius: theme.radius.card28,
            overflow: 'hidden',
          }}
        >
          <WhereMap
            center={
              mapMarkers[0]
                ? { latitude: mapMarkers[0].lat, longitude: mapMarkers[0].lng }
                : ACTION_MAP_CENTER
            }
            zoom={10}
            showsUser={false}
            markers={mapMarkers}
            onMarkerPress={() => undefined}
          >
            {() => (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: theme.color.commitFill,
                }}
              />
            )}
          </WhereMap>
          <Text
            variant="small"
            style={{ position: 'absolute', bottom: 12, left: 12 }}
          >
            {mapMarkers.length ? 'Your activity' : 'No drops yet'}
          </Text>
        </View>
      )}
      <Pressable
        testID="impact-share"
        onPress={() => {
          void share.share('Show friends where your waste diversions add up.');
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

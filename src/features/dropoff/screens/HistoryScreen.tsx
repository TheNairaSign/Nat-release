import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  formatDropoffWhen,
  dropoffStatusColor,
  inMonth,
  isFutureMonth,
  kindBadge,
  monthTitle,
  shiftMonth,
  startOfMonth,
  truncateName,
} from '@/core/dropoff';
import {
  fetchImpactActivities,
  impactDropoffsQueryKey,
} from '@/features/impact';
import { useSession } from '@/features/auth';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

export function HistoryScreen() {
  const theme = useTheme();
  const { http, navigation, share, clock } = usePorts();
  const { session } = useSession();
  const userId = session?.userId ?? '';
  const [month, setMonth] = useState(() => startOfMonth(clock.now()));
  const query = useQuery({
    queryKey: [...impactDropoffsQueryKey, userId],
    queryFn: () => fetchImpactActivities(http, userId),
    enabled: Boolean(userId),
  });
  const all = query.data ?? [];
  const items = all.filter((item) => item.at && inMonth(item.at, month));

  if (!userId) {
    return (
      <ChromeScreen>
        <Text>Please log in to see your drop-offs.</Text>
      </ChromeScreen>
    );
  }
  if (query.isPending) {
    return (
      <ChromeScreen>
        <Text>Loading your drop-offs...</Text>
      </ChromeScreen>
    );
  }
  if (query.isError) {
    return (
      <ChromeScreen>
        <Text>Failed to load drop-offs. Please try again later.</Text>
      </ChromeScreen>
    );
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <Text style={{ fontSize: 22, fontFamily: theme.font.bold }}>
        My Drop-offs
      </Text>
      <View
        style={{
          marginTop: 12,
          backgroundColor: theme.color.band,
          borderRadius: theme.radius.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 8,
        }}
      >
        <Pressable
          testID="history-prev"
          onPress={() => setMonth((current) => shiftMonth(current, -1))}
        >
          <ChevronGlyph color={theme.color.text} direction="left" size={16} />
        </Pressable>
        <Text style={{ fontFamily: theme.font.semibold }}>
          {monthTitle(month)}
        </Text>
        <Pressable
          testID="history-next"
          disabled={isFutureMonth(shiftMonth(month, 1), clock.now())}
          onPress={() => setMonth((current) => shiftMonth(current, 1))}
        >
          <ChevronGlyph color={theme.color.text} direction="right" size={16} />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <View style={{ marginTop: 24 }}>
          <Text muted>No drop-offs recorded for {monthTitle(month)}.</Text>
          {all.length === 0 ? (
            <Pressable
              testID="history-create"
              onPress={() => navigation.navigate('/dropoff/create')}
            >
              <Text style={{ marginTop: 8, fontFamily: theme.font.semibold }}>
                You haven{"'"}t made any drop-offs yet. Make one now!
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            style={{
              marginTop: 12,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.lg,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.color.borderSolid,
            }}
          >
            <Text style={{ fontFamily: theme.font.semibold }}>
              {truncateName(item.name)}
            </Text>
            <Text variant="small" muted>
              {kindBadge(item.kind)} · {formatDropoffWhen(item.at)}
            </Text>
            <Text variant="small">
              {item.quantity} {item.materialType ?? 'items'}
            </Text>
            {item.status ? (
              // web: `text-xs mt-2 font-medium`, colour by status
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: theme.font.medium,
                  marginTop: 8,
                  color: dropoffStatusColor(item.status),
                }}
              >
                Status: {item.status}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.color.cuPill,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text variant="small" style={{ color: '#fff' }}>
                  {item.carbonUnits} CU
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  void share.share('Show off your environmental impact!');
                }}
              >
                <Text style={{ fontFamily: theme.font.semibold }}>Share</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ChromeScreen>
  );
}

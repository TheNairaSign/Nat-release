import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { capitalizeChip } from '@/core/materials';
import {
  campaignMaterialType,
  campaignProgressPct,
  endsLabel,
  filterCampaigns,
  isUrgentCampaign,
} from '@/core/campaigns';
import { CampaignMaterialIcon } from '../ui/CampaignMaterialIcon';
import { fetchCampaigns, campaignsQueryKey } from '../api/campaigns-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';
import { PinGlyph } from '@/shared/ui/icons/glyphs';

export function CampaignsScreen() {
  const theme = useTheme();
  const { http, navigation, location } = usePorts();
  const query = useQuery({
    queryKey: campaignsQueryKey,
    queryFn: async () => {
      const origin = await location.getCurrentPosition();
      return fetchCampaigns(http, origin);
    },
  });

  const [material, setMaterial] = useState<string | null>(null);
  const campaigns = useMemo(() => query.data ?? [], [query.data]);

  // Web builds its filter row from the material types actually present.
  const materials = useMemo(() => {
    const seen = new Set<string>();
    for (const item of campaigns) {
      const type = campaignMaterialType(item.materialType);
      if (type && type !== 'All') seen.add(type);
    }
    return Array.from(seen);
  }, [campaigns]);

  const visible = useMemo(
    () => filterCampaigns(campaigns, material),
    [campaigns, material],
  );

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 24, fontFamily: theme.font.bold }}>Events</Text>
        {/* The events part of the Where map, around wherever they are (web, Oct 29). */}
        <Pressable
          testID="campaigns-view-on-map"
          onPress={() => navigation.navigate('/where?focus=events')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            backgroundColor: '#111111',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <PinGlyph color="#ffffff" size={12} />
          <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#ffffff' }}>
            View on map
          </Text>
        </Pressable>
      </View>

      {materials.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        >
          {materials.map((type) => {
            const active = material === type;
            return (
              <Pressable
                key={type}
                testID={`campaign-filter-${type}`}
                onPress={() => setMaterial(active ? null : type)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: theme.radius.pill,
                  backgroundColor: active ? theme.color.ink : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: theme.font.semibold,
                    color: active ? '#ffffff' : theme.color.text,
                  }}
                >
                  {capitalizeChip(type)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {query.isPending ? <Text muted>Fetching events...</Text> : null}
      {visible.length === 0 && !query.isPending ? (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text muted style={{ textAlign: 'center' }}>
            No events found with selected filters, try adjusting your
            filters.
          </Text>
          {material ? (
            <Pressable
              testID="campaign-clear-filters"
              onPress={() => setMaterial(null)}
              style={{ marginTop: 8 }}
            >
              <Text
                style={{
                  color: '#16a34a',
                  textDecorationLine: 'underline',
                }}
              >
                Clear filters
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        visible.map((item) => {
          const materialType = campaignMaterialType(item.materialType);
          const progress = campaignProgressPct(item.progress, item.goal);

          return (
            <Pressable
              key={item.id}
              testID={`campaign-${item.id}`}
              // The event on the Where map, with its card open (web, Oct 29).
              onPress={() =>
                navigation.navigate(`/where?focus=events&eventId=${encodeURIComponent(item.id)}`)
              }
              style={{
                marginTop: 12,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.04)',
              }}
            >
              <View>
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      'https://via.placeholder.com/300x150?text=Event',
                  }}
                  style={{ height: 160, width: '100%' }}
                />
                {/* web: absolute top-2 left-2 bg-white p-2 rounded-full */}
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: 8,
                    borderRadius: theme.radius.pill,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <CampaignMaterialIcon materialType={materialType} />
                </View>
                {isUrgentCampaign(item.startDate) ? (
                  // web: absolute top-2 right-2 bg-red-100 text-red-800 pill
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: theme.radius.pill,
                      backgroundColor: '#FEE2E2',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: theme.font.medium,
                        color: '#991B1B',
                      }}
                    >
                      Urgent
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    numberOfLines={2}
                    style={{
                      flexShrink: 1,
                      fontSize: 18,
                      lineHeight: 24,
                      fontFamily: theme.font.bold,
                      color: '#1F2937',
                    }}
                  >
                    {item.name}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: theme.radius.pill,
                      backgroundColor: '#F3F4F6',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: theme.color.text }}>
                      {capitalizeChip(materialType)}
                    </Text>
                  </View>
                </View>

                <Text
                  variant="small"
                  muted
                  numberOfLines={2}
                  style={{ marginBottom: 12 }}
                >
                  {item.description}
                </Text>

                {/* web shows a "Progress / N%" caption row above the bar, and no
                    bar at all when the event has no goal */}
                {progress !== null ? (
                <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
                    Progress
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
                    {progress}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: '#E5E7EB',
                    borderRadius: theme.radius.pill,
                  }}
                >
                  <View
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#204C27',
                      borderRadius: theme.radius.pill,
                    }}
                  />
                </View>
                </>
                ) : null}

                {/* Ends date and "View →" share one row on web */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
                    {endsLabel(item.endDate)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#204C27',
                      fontFamily: theme.font.semibold,
                    }}
                  >
                    View →
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </ChromeScreen>
  );
}

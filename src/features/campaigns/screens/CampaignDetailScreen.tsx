import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import {
  campaignProgressPct,
  endsLabel,
  isUrgentCampaign,
} from '@/core/campaigns';
import { createDropoffHref } from '@/core/dropoff';
import { fetchCampaignDetail } from '../api/campaigns-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

export function CampaignDetailScreen({ id }: { id: string }) {
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const [locationIndex, setLocationIndex] = useState(0);
  const query = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaignDetail(http, id),
  });
  const item = query.data;
  if (query.isPending) {
    return (
      <ChromeScreen>
        <Text>Loading…</Text>
      </ChromeScreen>
    );
  }
  if (!item) {
    return (
      <ChromeScreen>
        <ScreenBack onPress={() => navigation.back()} />
        <Text>Campaign not found.</Text>
      </ChromeScreen>
    );
  }
  const pct = campaignProgressPct(item.progress, item.goal);
  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ height: 180, borderRadius: 16, width: '100%' }}
        />
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 12,
        }}
      >
        {item.materialTypes.map((material) => (
          <View
            key={material}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.highlight,
            }}
          >
            <Text variant="small">{material}</Text>
          </View>
        ))}
        {item.status ? (
          <Text variant="small" muted>
            {item.status}
          </Text>
        ) : null}
        {isUrgentCampaign(item.startDate) ? (
          <Text
            variant="small"
            style={{ color: '#991b1b', fontFamily: theme.font.semibold }}
          >
            Urgent
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 22, fontFamily: theme.font.bold, marginTop: 8 }}>
        {item.name}
      </Text>
      <Text
        style={{
          fontSize: 18,
          fontFamily: theme.font.semibold,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        About this Campaign
      </Text>
      <Text style={{ color: '#374151' }}>{item.description}</Text>
      <Text variant="small" muted style={{ marginTop: 8 }}>
        {endsLabel(item.endDate, item.isIndefinite)}
      </Text>
      {/* web: "Campaign Progress" and the percentage share one
          justify-between row above an h-3 bar, with Goal / Current beneath. */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontFamily: theme.font.semibold }}>
          Campaign Progress
        </Text>
        <Text style={{ fontFamily: theme.font.semibold }}>{pct}%</Text>
      </View>
      <View
        style={{
          height: 12,
          backgroundColor: '#E5E7EB',
          borderRadius: theme.radius.pill,
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: '#16a34a',
            borderRadius: theme.radius.pill,
          }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
            Goal
          </Text>
          <Text style={{ fontFamily: theme.font.semibold }}>{item.goal}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
            Current
          </Text>
          <Text style={{ fontFamily: theme.font.semibold }}>
            {item.progress}
          </Text>
        </View>
      </View>
      {item.locations.length > 0 ? (
        <>
          <Text
            style={{
              fontSize: 18,
              fontFamily: theme.font.semibold,
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            Collection Locations
          </Text>
          {item.locations.map((location, index) => (
            <Pressable
              key={`${location.name}-${index}`}
              testID={`campaign-location-${index}`}
              onPress={() => setLocationIndex(index)}
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor:
                  locationIndex === index
                    ? theme.color.slateCta
                    : theme.color.borderSolid,
                backgroundColor:
                  locationIndex === index
                    ? theme.color.band
                    : theme.color.surface,
              }}
            >
              <Text style={{ fontFamily: theme.font.semibold }}>
                {location.name}
              </Text>
              {location.address ? (
                <Text variant="small" muted>
                  {location.address}
                </Text>
              ) : null}
              {location.material ? (
                <Text variant="small" muted>
                  Accepts {location.material}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </>
      ) : null}
      <Pressable
        testID="campaign-record"
        onPress={() =>
          navigation.navigate(
            createDropoffHref({
              mode: 'campaign',
              campaignId: item.id,
              campaignName: item.name,
              type: item.materialType,
              campaignLocationIndex: locationIndex,
            }),
          )
        }
        style={{
          marginTop: 20,
          backgroundColor: theme.color.slateCta,
          borderRadius: theme.radius.pill,
          paddingVertical: 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.semibold }}>
          Support This Campaign
        </Text>
      </Pressable>
    </ChromeScreen>
  );
}

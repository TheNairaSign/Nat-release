import { Image, Pressable, View } from 'react-native';

import {
  campaignProgressPct,
  endsLabel,
  isUrgentCampaign,
} from '@/core/campaigns';
import { fetchCampaigns, campaignsQueryKey } from '../api/campaigns-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

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

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <Text style={{ fontSize: 22, fontFamily: theme.font.bold }}>
        Campaign Events
      </Text>
      {query.isPending ? <Text muted>Fetching campaigns...</Text> : null}
      {(query.data ?? []).length === 0 && !query.isPending ? (
        <Text muted style={{ marginTop: 16 }}>
          No campaigns found with selected filters, try adjusting your filters.
        </Text>
      ) : (
        (query.data ?? []).map((item) => (
          <Pressable
            key={item.id}
            testID={`campaign-${item.id}`}
            onPress={() => navigation.navigate(`/campaigns/${item.id}`)}
            style={{
              marginTop: 12,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.color.borderSolid,
            }}
          >
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  'https://via.placeholder.com/300x150?text=Campaign+Image',
              }}
              style={{ height: 160, width: '100%' }}
            />
            <View style={{ padding: 12 }}>
              {isUrgentCampaign(item.startDate) ? (
                <Text variant="small" style={{ color: '#991b1b' }}>
                  Urgent
                </Text>
              ) : null}
              <Text style={{ fontFamily: theme.font.bold }}>{item.name}</Text>
              <Text variant="small" muted numberOfLines={2}>
                {item.description}
              </Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: theme.color.band,
                  borderRadius: 4,
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    width: `${campaignProgressPct(item.progress, item.goal)}%`,
                    height: '100%',
                    backgroundColor: theme.color.accent,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text variant="small" muted>
                {endsLabel(item.endDate)}
              </Text>
              <Text
                style={{
                  color: theme.color.accent,
                  fontFamily: theme.font.semibold,
                }}
              >
                View →
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ChromeScreen>
  );
}

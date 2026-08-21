import { useState } from 'react';
import { TextInput, View } from 'react-native';

import {
  calculateUserContributions,
  filterContributions,
  lastDropoffLabel,
  materialUnit,
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
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

export function ContributionsScreen() {
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const { session } = useSession();
  const userId = session?.userId ?? '';
  const [query, setQuery] = useState('');
  const userQuery = useQuery({
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
  const rows = filterContributions(
    calculateUserContributions(
      (dropoffsQuery.data ?? []).filter((item) => item.kind !== 'simple'),
      userQuery.data?.itemsCount ?? {},
      catalogQuery.data?.types ?? [],
      catalogQuery.data?.materials ?? [],
    ),
    query,
  );

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.navigate('/impact')} />
      <Text style={{ fontSize: 22, fontFamily: theme.font.bold }}>
        Material Contributions
      </Text>
      <TextInput
        placeholder="Search material types..."
        placeholderTextColor={theme.color.placeholder}
        value={query}
        onChangeText={setQuery}
        style={{
          marginTop: 12,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.color.borderSolid,
          padding: 12,
          color: theme.color.text,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
        }}
      >
        <Text style={{ fontFamily: theme.font.semibold }}>
          Your Contributions
        </Text>
        <Text variant="small" muted>
          {rows.length} types
        </Text>
      </View>
      {rows.length === 0 ? (
        <Text muted style={{ marginTop: 16 }}>
          No material types found matching “{query}”
        </Text>
      ) : (
        rows.map((row) => (
          <View
            key={row.materialType}
            style={{
              marginTop: 12,
              backgroundColor: theme.color.limeTrack,
              borderRadius: theme.radius.md,
              borderWidth: 2,
              borderColor: theme.color.lime,
              padding: 16,
            }}
          >
            <Text style={{ fontFamily: theme.font.bold }}>{row.label}</Text>
            <Text variant="small">{row.totalDropoffs} dropoffs</Text>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 8,
                backgroundColor: theme.color.ink,
                borderRadius: theme.radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text variant="small" style={{ color: theme.color.accentText }}>
                {Math.round(row.carbonUnits)} CU
              </Text>
            </View>
            <Text variant="small" muted style={{ marginTop: 8 }}>
              Total Quantity {Math.round(row.totalQuantity)}{' '}
              {materialUnit(row.materialType)}
            </Text>
            <Text variant="small" muted>
              Last Dropoff {lastDropoffLabel(row.lastDropoff)}
            </Text>
            <Text variant="small">
              Impact Score{' '}
              {(row.carbonUnits / Math.max(row.totalQuantity, 1)).toFixed(2)}{' '}
              CU/unit
            </Text>
          </View>
        ))
      )}
    </ChromeScreen>
  );
}

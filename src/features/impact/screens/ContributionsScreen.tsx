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
import { BreakdownGlyph } from '../ui/ImpactBreakdownCard';
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
      <Text style={{ fontSize: 18, fontFamily: theme.font.bold }}>
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
        <Text style={{ fontSize: 18, fontFamily: theme.font.bold }}>
          Your Contributions
        </Text>
        <Text variant="small" muted>
          {rows.length} types
        </Text>
      </View>
      {rows.length === 0 ? (
        <Text muted style={{ marginTop: 16 }}>
          {/* web renders &quot; — straight double quotes around the term */}
          {`No material types found matching "${query}"`}
        </Text>
      ) : (
        rows.map((row) => (
          <View
            key={row.materialType}
            style={{
              marginTop: 12,
              backgroundColor: theme.color.limeTrack,
              borderRadius: theme.radius.xl,
              borderWidth: 2,
              borderColor: theme.color.lime,
              padding: 24,
            }}
          >
            {/* web MaterialContributionCard (full variant):
                  header row  — icon + label/dropoffs on the left, CU pill right
                  grid-cols-2 — Total Quantity | Last Dropoff
                  sub-panel   — bg-white/50 rounded-lg with the Impact Score */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  flexShrink: 1,
                }}
              >
                <BreakdownGlyph materialType={row.materialType} />
                <View style={{ flexShrink: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 18, fontFamily: theme.font.bold }}
                  >
                    {row.label}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#4B5563' }}>
                    {row.totalDropoffs} dropoffs
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: '#000000',
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: theme.font.bold,
                    color: '#ffffff',
                  }}
                >
                  {Math.round(row.carbonUnits)} CU
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}
                >
                  Total Quantity
                </Text>
                <Text style={{ fontSize: 24, fontFamily: theme.font.bold }}>
                  {Math.round(row.totalQuantity)}
                </Text>
                <Text style={{ fontSize: 12, color: '#4B5563' }}>
                  {materialUnit(row.materialType)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}
                >
                  Last Dropoff
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: theme.font.medium,
                    color: '#334155',
                  }}
                >
                  {lastDropoffLabel(row.lastDropoff)}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderRadius: theme.radius.lg,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 12, color: '#4B5563' }}>
                Impact Score
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: theme.font.bold,
                  color: '#15803D',
                }}
              >
                {(row.carbonUnits / Math.max(row.totalQuantity, 1)).toFixed(2)}{' '}
                CU/unit
              </Text>
            </View>
          </View>
        ))
      )}
    </ChromeScreen>
  );
}

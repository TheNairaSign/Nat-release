import type { ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import {
  formatDistanceKm,
  haversineKm,
  searchTypeLabel,
  type OrganizationResult,
  type WherePlace,
} from '@/core/where';
import { useTheme } from '@/shared/theme';
import { CloseGlyph, PinGlyph, SearchGlyph } from '@/shared/ui/icons/glyphs';
import {
  BuildingGlyph,
  MapPinGlyph,
  PackageGlyph,
} from '@/shared/ui/icons/featherGlyphs';
import { Text } from '@/shared/ui/Text';

export function MapSearchPanel({
  query,
  onQuery,
  onCancel,
  results,
  onSelect,
  origin,
  organizations = [],
  onSelectOrganization,
  materialTypes = [],
  onSelectMaterialType,
}: {
  query: string;
  onQuery: (value: string) => void;
  onCancel: () => void;
  results: WherePlace[];
  onSelect: (place: WherePlace) => void;
  /** Used to show each result's distance, as web does from `distanceKm`. */
  origin?: { latitude: number; longitude: number } | null;
  /** Organisations matching the query — web groups these above the results. */
  organizations?: OrganizationResult[];
  onSelectOrganization?: (name: string) => void;
  /** Material types matching the query. */
  materialTypes?: string[];
  onSelectMaterialType?: (materialType: string) => void;
}) {
  const theme = useTheme();
  const hasQuery = query.trim().length > 0;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <SearchGlyph color={theme.color.textMuted} />
          <TextInput
            testID="where-search-input"
            value={query}
            onChangeText={onQuery}
            placeholder="Search…"
            placeholderTextColor={theme.color.placeholder}
            autoFocus
            style={{
              flex: 1,
              fontSize: 14,
              color: theme.color.text,
              fontFamily: theme.font.regular,
              padding: 0,
            }}
          />
          {hasQuery ? (
            <Pressable accessibilityRole="button" onPress={() => onQuery('')}>
              <CloseGlyph color={theme.color.textMuted} size={16} />
            </Pressable>
          ) : null}
        </View>
        <Pressable testID="where-search-cancel" onPress={onCancel}>
          <Text
            variant="small"
            style={{ fontFamily: theme.font.semibold, color: theme.color.ink }}
          >
            Cancel
          </Text>
        </Pressable>
      </View>
      <Text
        style={{ fontSize: 11, color: theme.color.textMuted, lineHeight: 16 }}
      >
        Search by location name, material (plastic, food…), organization, or
        event. Browse nearby below.
      </Text>
      <View
        style={{
          maxHeight: 280,
          borderRadius: theme.radius.lg,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {hasQuery && organizations.length > 0 ? (
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0,0,0,0.05)',
              paddingBottom: 8,
            }}
          >
            <SectionLabel>Organizations</SectionLabel>
            {organizations.map((org) => (
              <Pressable
                key={org.id}
                testID={`where-search-org-${org.id}`}
                onPress={() => onSelectOrganization?.(org.name)}
                style={rowStyle}
              >
                <IconWell>
                  <BuildingGlyph color="#475569" size={16} />
                </IconWell>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, fontFamily: theme.font.medium }}
                  >
                    {org.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
                    {org.locationCount}{' '}
                    {org.locationCount === 1 ? 'location' : 'locations'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {hasQuery && materialTypes.length > 0 ? (
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0,0,0,0.05)',
              paddingBottom: 8,
            }}
          >
            <SectionLabel>Materials</SectionLabel>
            {materialTypes.map((type) => (
              <Pressable
                key={type}
                testID={`where-search-material-${type}`}
                onPress={() => onSelectMaterialType?.(type)}
                style={rowStyle}
              >
                <IconWell>
                  <PackageGlyph color="#475569" size={16} />
                </IconWell>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: theme.font.medium,
                    textTransform: 'capitalize',
                  }}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text
          style={{
            fontSize: 10,
            fontFamily: theme.font.bold,
            color: theme.color.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
        >
          {hasQuery ? `Results (${results.length})` : 'Nearby (closest first)'}
        </Text>
        {results.length === 0 ? (
          <Text
            muted
            variant="small"
            style={{ textAlign: 'center', padding: 24 }}
          >
            {hasQuery ? 'No results found' : 'No locations loaded yet'}
          </Text>
        ) : (
          <ScrollView>
            {results.map((place) => {
              const distance = origin
                ? formatDistanceKm(
                    haversineKm(
                      origin.latitude,
                      origin.longitude,
                      place.lat,
                      place.lng,
                    ),
                  )
                : null;

              return (
                <Pressable
                  key={`${place.kind}-${place.id}`}
                  testID={`where-search-result-${place.id}`}
                  onPress={() => onSelect(place)}
                  // web: flex items-start gap-3 px-3 py-2.5 rounded-xl
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <PinGlyph color="#475569" size={16} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          flexShrink: 1,
                          fontSize: 14,
                          fontFamily: theme.font.semibold,
                          color: theme.color.text,
                        }}
                      >
                        {place.name}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: theme.radius.pill,
                          backgroundColor: '#F1F5F9',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: theme.font.semibold,
                            color: '#475569',
                          }}
                        >
                          {searchTypeLabel(place)}
                        </Text>
                      </View>
                      {distance ? (
                        <Text
                          style={{
                            marginLeft: 'auto',
                            fontSize: 11,
                            fontFamily: theme.font.medium,
                            color: theme.color.textMuted,
                          }}
                        >
                          {distance}
                        </Text>
                      ) : null}
                    </View>

                    {place.address ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 4,
                        }}
                      >
                        <View style={{ marginTop: 2 }}>
                          <MapPinGlyph
                            color={theme.color.textMuted}
                            size={12}
                          />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: theme.color.textMuted,
                          }}
                        >
                          {place.address}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/** `px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500` */
function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 10,
        fontFamily: theme.font.bold,
        color: theme.color.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

/** `w-8 h-8 rounded-full bg-slate-100` icon well used by both grouped rows. */
function IconWell({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

/** `w-full flex items-center gap-3 px-3 py-2 rounded-xl` */
const rowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingHorizontal: 12,
  paddingVertical: 8,
};

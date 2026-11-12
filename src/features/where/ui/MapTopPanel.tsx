import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';

import { capitalizeChip } from '@/core/materials';
import {
  eventsLabel,
  type MapPanelFocus,
  type OrganizationResult,
  type WherePlace,
} from '@/core/where';
import { useTheme } from '@/shared/theme';
import { FilterGlyph, SearchGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

import { SnapCarousel } from '@/shared/ui/SnapCarousel';

import { MapSearchPanel } from './MapSearchPanel';

// Web's SnapCardCarousel for Where (main) is `w-[88%]`, `pl-[4%]`, `pr-[6%]`, `gap-4`,
// no `scaleInactive`. On a phone that leaves ~12pt of the Events card showing, which
// feedback said reads as no card at all, so the card is a little narrower here (84%,
// 12pt gap: ~30pt of Events peeks in). The old 92% card shrunk the inactive one too.
const SCREEN_WIDTH = Dimensions.get('window').width;
const PAD_LEFT = Math.round(SCREEN_WIDTH * 0.04);
const PAD_RIGHT = Math.round(SCREEN_WIDTH * 0.06);

export function MapTopPanel({
  focus,
  onFocus,
  chips,
  chipsLoading,
  selectedMaterial,
  onSelectMaterial,
  searchOpen,
  onOpenSearch,
  onCloseSearch,
  searchQuery,
  onSearchQuery,
  searchResults,
  onSelectPlace,
  filterOpen,
  onToggleFilter,
  hasActiveFilters,
  eventsCount,
  eventsReady,
  organization,
  origin,
  searchOrganizations,
  onSelectOrganization,
  searchMaterialTypes,
}: {
  focus: MapPanelFocus;
  onFocus: (focus: MapPanelFocus) => void;
  chips: string[];
  chipsLoading: boolean;
  selectedMaterial: string | null;
  onSelectMaterial: (material: string | null) => void;
  searchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  searchQuery: string;
  onSearchQuery: (value: string) => void;
  searchResults: WherePlace[];
  onSelectPlace: (place: WherePlace) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
  hasActiveFilters: boolean;
  eventsCount: number;
  eventsReady: boolean;
  organization?: string | null;
  /** Passed down so search results can show their distance. */
  origin?: { latitude: number; longitude: number } | null;
  searchOrganizations?: OrganizationResult[];
  onSelectOrganization?: (name: string) => void;
  searchMaterialTypes?: string[];
}) {
  const theme = useTheme();
  const iconActive = filterOpen || hasActiveFilters;
  // Mirrors web's `chipGestureRef`: while a chip drag is in flight the card
  // carousel is locked, so the swipe scrolls the materials rather than paging
  // the card.
  const [chipGesture, setChipGesture] = useState(false);
  const chipScrollRef = useRef<ScrollView>(null);
  // Chip x-offsets live in state, not a ref, so the scroll effect re-runs when
  // a chip is measured after the selection was already set. Holding them in a
  // ref meant the effect could run before `onLayout` and then never again.
  const [chipOffsets, setChipOffsets] = useState<Record<string, number>>({});
  // Guards the auto-scroll so it fires once per selection. `onLayout` fires on
  // every layout pass, so scrolling from there yanked the row back to the
  // selected chip whenever the card re-laid out under the user's finger.
  const scrolledForRef = useRef<string | null>(null);

  // Web's chip row (WhereMapbox.tsx) is a plain `overflow-x-auto` strip with no
  // scroll-into-view: on a wide screen every chip is visible. On a phone the
  // material picked on Home is usually off-screen, so bring it into view.
  useEffect(() => {
    if (!selectedMaterial) {
      scrolledForRef.current = null;
      return;
    }
    if (chipsLoading) return;
    if (scrolledForRef.current === selectedMaterial) return;
    const x = chipOffsets[selectedMaterial];
    if (x == null) return;
    scrolledForRef.current = selectedMaterial;
    chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [selectedMaterial, chipsLoading, chipOffsets]);

  return (
    <View>
      <SnapCarousel
        activeIndex={focus === 'points' ? 0 : 1}
        onActiveIndexChange={(index) =>
          onFocus(index === 0 ? 'points' : 'events')
        }
        cardWidthRatio={0.84}
        scrollEnabled={!chipGesture}
        padLeft={PAD_LEFT}
        padRight={PAD_RIGHT}
        gap={12}
      >
        {[
          <View
            key="points"
            testID="where-points-card"
            style={{
              minHeight: theme.layout.whereCardMinHeight,
              backgroundColor: theme.color.mapPoints,
              borderRadius: theme.radius.card28,
              padding: 20,
            }}
          >
            {searchOpen ? (
              <MapSearchPanel
                query={searchQuery}
                onQuery={onSearchQuery}
                onCancel={onCloseSearch}
                results={searchResults}
                onSelect={onSelectPlace}
                origin={origin}
                organizations={searchOrganizations}
                onSelectOrganization={onSelectOrganization}
                materialTypes={searchMaterialTypes}
                onSelectMaterialType={onSelectMaterial}
              />
            ) : (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {organization ? (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: theme.font.semibold,
                          color: theme.color.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {organization}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        fontSize: 20,
                        fontFamily: theme.font.bold,
                        color: theme.color.text,
                        // web: leading-tight
                        lineHeight: 25,
                      }}
                    >
                      Diversion Points
                    </Text>
                    {/* web: line-clamp-2 — without a cap a long subtitle grows
                        the header and pushes the chip row out of the card. */}
                    <Text
                      variant="small"
                      muted
                      numberOfLines={2}
                      style={{ marginTop: 4 }}
                    >
                      Where to drop-off, recycle and more
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Pressable
                      testID="where-search"
                      accessibilityRole="button"
                      accessibilityLabel="Search locations"
                      onPress={onOpenSearch}
                      style={{
                        width: theme.layout.whereIconBtn,
                        height: theme.layout.whereIconBtn,
                        borderRadius: theme.radius.pill,
                        borderWidth: 1,
                        borderColor: theme.color.borderSolid,
                        backgroundColor: theme.color.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SearchGlyph color={theme.color.textMuted} size={14} />
                    </Pressable>
                    <Pressable
                      testID="where-filter"
                      accessibilityRole="button"
                      onPress={onToggleFilter}
                      style={{
                        width: theme.layout.whereIconBtn,
                        height: theme.layout.whereIconBtn,
                        borderRadius: theme.radius.pill,
                        borderWidth: 1,
                        borderColor: iconActive
                          ? theme.color.ink
                          : theme.color.borderSolid,
                        backgroundColor: iconActive
                          ? theme.color.ink
                          : theme.color.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FilterGlyph
                        color={
                          iconActive
                            ? theme.color.accentText
                            : theme.color.textMuted
                        }
                      />
                    </Pressable>
                  </View>
                </View>
                {/* This row lives inside the horizontal card carousel, so
                    without `nestedScrollEnabled` the outer ScrollView takes the
                    gesture and a chip swipe slides the whole card instead —
                    you could never scroll past the first few materials. */}
                <ScrollView
                  ref={chipScrollRef}
                  horizontal
                  nestedScrollEnabled
                  directionalLockEnabled
                  showsHorizontalScrollIndicator={false}
                  onTouchStart={() => setChipGesture(true)}
                  onTouchEnd={() => setChipGesture(false)}
                  onTouchCancel={() => setChipGesture(false)}
                  onMomentumScrollEnd={() => setChipGesture(false)}
                  style={{ marginTop: 12, height: theme.layout.chipRowHeight }}
                  contentContainerStyle={{ gap: 8, alignItems: 'center' }}
                >
                  {chipsLoading
                    ? [0, 1, 2].map((key) => (
                        <View
                          key={key}
                          style={{
                            width: 72,
                            height: 36,
                            borderRadius: theme.radius.pill,
                            backgroundColor: 'rgba(0,0,0,0.08)',
                          }}
                        />
                      ))
                    : ['All', ...chips].map((chip) => {
                        const value = chip === 'All' ? null : chip;
                        const active =
                          selectedMaterial === value && focus === 'points';
                        return (
                          <Pressable
                            key={chip}
                            testID={`where-chip-${chip}`}
                            onLayout={(event) => {
                              if (!value) return;
                              const { x } = event.nativeEvent.layout;
                              setChipOffsets((prev) =>
                                prev[value] === x
                                  ? prev
                                  : { ...prev, [value]: x },
                              );
                            }}
                            onPress={() => {
                              onFocus('points');
                              onSelectMaterial(value);
                            }}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: theme.radius.pill,
                              backgroundColor: active
                                ? theme.color.ink
                                : theme.color.mapChipIdle,
                              borderWidth: active ? 0 : 1,
                              borderColor: 'rgba(0,0,0,0.1)',
                            }}
                          >
                            <Text
                              variant="small"
                              style={{
                                fontFamily: theme.font.semibold,
                                color: active
                                  ? theme.color.accentText
                                  : theme.color.ink,
                              }}
                            >
                              {chip === 'All' ? 'All' : capitalizeChip(chip)}
                            </Text>
                          </Pressable>
                        );
                      })}
                </ScrollView>
              </>
            )}
          </View>,

          <Pressable
            key="events"
            testID="where-events-card"
            onPress={() => onFocus('events')}
            style={{
              minHeight: theme.layout.whereCardMinHeight,
              backgroundColor: theme.color.mapEvents,
              borderRadius: theme.radius.card28,
              padding: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {organization ? (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: theme.font.semibold,
                  color: theme.color.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {organization}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: 21.6,
                fontFamily: theme.font.bold,
                color: theme.color.text,
                textAlign: 'center',
                // web: leading-tight + tracking-tight on the centered variant
                lineHeight: 27,
                letterSpacing: -0.54,
              }}
            >
              Diversion Events
            </Text>
            <Text
              variant="small"
              muted
              numberOfLines={2}
              style={{ marginTop: 4, textAlign: 'center' }}
            >
              Pop-up collections and drives
            </Text>
            {/* web (Nov 2): a smaller second line, a tip about using the map */}
            <Text
              style={{ marginTop: 2, fontSize: 12.8, color: '#64748b', textAlign: 'center' }}
            >
              Zoom out to see more
            </Text>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.mapChipIdle,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.05)',
              }}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: theme.font.semibold,
                  color: theme.color.label,
                }}
              >
                {eventsReady ? eventsLabel(eventsCount) : '…'}
              </Text>
            </View>
          </Pressable>,
        ]}
      </SnapCarousel>
    </View>
  );
}

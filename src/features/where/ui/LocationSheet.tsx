import { Image, Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';

import type { WherePlace } from '@/core/where';
import { useTheme } from '@/shared/theme';
import { ChevronGlyph, CloseGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

import { EventMaterialBlock } from './EventMaterialBlock';

/** Transcribed from PHASE_UI in
 *  client/src/pages/dashboard/where/components/CampaignDetailsCard.tsx */
const PHASE_CARD = {
  live: {
    bg: '#E8F9E4',
    label: 'Diversion event',
    badgeBg: '#059669', // emerald-600
    badgeText: '#FFFFFF',
    titleColor: '#065F46', // emerald-800
  },
  upcoming: {
    bg: '#FFF9E8',
    label: 'Upcoming event',
    badgeBg: '#F5D74D',
    badgeText: '#1A1A1A',
    titleColor: '#8A6E0F',
  },
  ended: {
    bg: '#F3F4F6',
    label: 'Ended event',
    badgeBg: '#6B7280', // gray-500
    badgeText: '#FFFFFF',
    titleColor: '#6B7280',
  },
} as const;

export function LocationSheet({
  place,
  reminderPending,
  onClose,
  onRecord,
  onDirections,
  onReminder,
  onFocusBranch,
  initialBranchIndex = null,
}: {
  place: WherePlace;
  reminderPending?: boolean;
  onClose: () => void;
  onRecord: () => void;
  onDirections: () => void;
  onReminder?: () => void;
  /** Re-centres the map on the chosen branch, as `handleSimpleMarkerClick`
   *  does on web. Null selects the main location. */
  onFocusBranch?: (coords: { lat: number; lng: number } | null) => void;
  /** Branch pin the user tapped on the map, so the sheet opens on it. */
  initialBranchIndex?: number | null;
}) {
  const theme = useTheme();
  const [descOpen, setDescOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  // Web keeps `selectedExtraLocationIndex` alongside the selected location and
  // swaps the sheet's detail fields to that branch. Mobile listed branches as
  // flat muted text with no selection at all.
  const [branchesOpen, setBranchesOpen] = useState(initialBranchIndex !== null);
  const [branchIndex, setBranchIndex] = useState<number | null>(
    initialBranchIndex,
  );
  const branches = place.extraLocations ?? [];
  const activeBranch = branchIndex === null ? null : branches[branchIndex];

  const selectBranch = (index: number | null) => {
    setBranchIndex(index);
    const target = index === null ? null : branches[index];
    onFocusBranch?.(target ? { lat: target.lat, lng: target.lng } : null);
  };

  // Fields follow the selected branch, falling back to the main location.
  const shownAddress = activeBranch?.address ?? place.address;
  const shownPhone = activeBranch?.contactNumber ?? place.contactNumber;

  const campaign = place.kind === 'campaign';
  const simple = place.kind === 'simple';
  const phase = place.phase ?? 'live';
  const phaseUi = PHASE_CARD[phase];
  const showRecord =
    place.kind === 'regular' ||
    (simple && place.record && place.isActive !== false);
  const description = place.description?.trim() ?? '';
  const long = description.length > 140;
  const shown = !description
    ? ''
    : !long || descOpen
      ? description
      : `${description.slice(0, 140).trimEnd()}…`;
  const hoursText = !campaign ? place.hours?.trim() ?? '' : '';
  const hoursLong = hoursText.length > 90;
  const hoursShown = !hoursText
    ? ''
    : !hoursLong || hoursOpen
      ? hoursText
      : `${hoursText.slice(0, 90).trimEnd()}…`;
  const images = place.images ?? [];
  // Campaign sheets already show a full-bleed header image, so the thumbnail
  // strip is for the non-campaign sheets only.
  //
  // Web prefers the selected branch's own images over the parent location's.
  const thumbnails: string[] = campaign
    ? []
    : activeBranch?.images?.length
      ? activeBranch.images
      : images;
  const cardBg = campaign ? phaseUi.bg : theme.color.surface;

  return (
    <View
      testID="where-location-sheet"
      style={{
        backgroundColor: cardBg,
        borderRadius: campaign || simple ? 22 : 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxHeight: 480,
        ...theme.shadow.md,
      }}
    >
      {campaign && images[0] ? (
        // web: h-36 image, a from-black/45 top-fading scrim, and the phase
        // badge pinned bottom-left over it. Ended events are dimmed.
        <View
          style={{
            height: 144,
            width: '100%',
            backgroundColor: '#F5E6CC',
            opacity: phase === 'ended' ? 0.8 : 1,
          }}
        >
          <Image
            source={{ uri: images[0] }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 72,
              backgroundColor: 'rgba(0,0,0,0.28)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: phaseUi.badgeBg,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.bold,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: phaseUi.badgeText,
              }}
            >
              {phaseUi.label}
            </Text>
          </View>
        </View>
      ) : null}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          {campaign && !images[0] ? (
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.bold,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 4,
                color: phaseUi.titleColor,
              }}
            >
              {phaseUi.label}
            </Text>
          ) : null}
          <Text
            style={{
              // Web splits this across two components: the simple/regular
              // sheet uses text-[1.35rem] (~22px) and CampaignDetailsCard uses
              // text-base (16px) with leading-snug.
              fontSize: campaign ? 16 : 22,
              lineHeight: campaign ? 22 : 26,
              fontFamily: theme.font.bold,
              letterSpacing: campaign ? 0 : -0.3,
              // Ended campaigns drop to text-gray-600.
              color:
                campaign && phase === 'ended' ? '#4B5563' : theme.color.text,
            }}
            numberOfLines={2}
          >
            {place.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 6,
            }}
          >
            {place.tag ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: theme.radius.pill,
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: 'rgba(226,232,240,0.8)',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: theme.font.semibold,
                    color: '#334155',
                  }}
                >
                  {place.tag}
                </Text>
              </View>
            ) : null}
            {place.organizationName ? (
              <Text variant="caption" muted numberOfLines={1}>
                {place.organizationName}
              </Text>
            ) : null}
          </View>
        </View>
        <Pressable
          testID="where-sheet-close"
          onPress={onClose}
          style={{ padding: 6 }}
        >
          <CloseGlyph color={theme.color.placeholder} size={18} />
        </Pressable>
      </View>

      <ScrollView
        style={{ maxHeight: 220 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
          gap: 8,
        }}
      >
        {place.isActive === false ? (
          <Text variant="small" style={{ fontFamily: theme.font.semibold }}>
            Unavailable right now. Check back later.
          </Text>
        ) : null}
        {!campaign && images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {images.slice(0, 3).map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{
                  width: simple ? 48 : 128,
                  height: simple ? 48 : 96,
                  borderRadius: 8,
                }}
              />
            ))}
          </ScrollView>
        ) : null}
        {place.materials.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {place.materials.slice(0, 6).map((material) => (
              <View
                key={material}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: theme.radius.pill,
                  backgroundColor: simple ? theme.color.lime : '#eff6ff',
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: theme.font.semibold }}>
                  {material}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {/* Web shows up to three 48px thumbnails with a "+N" overflow tile
            (branch images take precedence over the location's own). */}
        {thumbnails.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {thumbnails.slice(0, 3).map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
                resizeMode="cover"
              />
            ))}
            {thumbnails.length > 3 ? (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.lg,
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.font.semibold,
                    color: '#475569',
                  }}
                >
                  +{thumbnails.length - 3}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {campaign && place.schedule ? (
          <Text variant="small" muted>
            {place.schedule}
            {place.hours ? ` · ${place.hours}` : ''}
          </Text>
        ) : null}
        {campaign && place.whoCanAttend ? (
          <Text variant="small" muted>
            {place.whoCanAttend}
          </Text>
        ) : null}
        {shown ? (
          <View>
            <Text variant="small" muted>
              {shown}
            </Text>
            {long ? (
              <Pressable onPress={() => setDescOpen((open) => !open)}>
                <Text
                  variant="small"
                  style={{
                    fontFamily: theme.font.semibold,
                    textDecorationLine: 'underline',
                  }}
                >
                  {descOpen ? 'less' : 'more'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {hoursShown ? (
          <View>
            <Text variant="small" muted>
              {hoursShown}
            </Text>
            {hoursLong ? (
              <Pressable onPress={() => setHoursOpen((open) => !open)}>
                <Text
                  variant="small"
                  style={{
                    fontFamily: theme.font.semibold,
                    textDecorationLine: 'underline',
                  }}
                >
                  {hoursOpen ? 'less' : 'more'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {campaign ? (
          // Events use web's lime chip block rather than a plain text list.
          <EventMaterialBlock materials={place.materials} />
        ) : (place.acceptedSubtypes ?? []).length > 0 ? (
          <Text variant="caption" muted>
            Accepted: {(place.acceptedSubtypes ?? []).slice(0, 5).join(', ')}
          </Text>
        ) : null}
        {shownAddress ? (
          <Text variant="small" muted>
            {shownAddress}
          </Text>
        ) : null}
        {shownPhone ? (
          <Text variant="small" muted>
            {shownPhone}
          </Text>
        ) : null}
        {place.whoCanDropOff ? (
          <Text variant="small" muted>
            {place.whoCanDropOff}
          </Text>
        ) : null}
        {place.website ? (
          <Text variant="small" muted>
            {place.website}
          </Text>
        ) : null}
        {place.paymentNote ? (
          <Text variant="small" muted>
            {place.paymentNote}
          </Text>
        ) : null}
        {branches.length > 0 ? (
          <View>
            <Pressable
              testID="where-branches-toggle"
              onPress={() => setBranchesOpen((open) => !open)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold }}>
                Branches ({branches.length + 1})
              </Text>
              <ChevronGlyph
                color={theme.color.textMuted}
                size={14}
                direction={branchesOpen ? 'up' : 'down'}
              />
            </Pressable>

            {branchesOpen ? (
              <View style={{ marginTop: 8, gap: 4 }}>
                <BranchRow
                  name={place.name}
                  address={place.address}
                  selected={branchIndex === null}
                  inactive={place.isActive === false}
                  onPress={() => selectBranch(null)}
                />
                {branches.map((extra, index) => (
                  <BranchRow
                    key={`branch-${index}`}
                    name={extra.name || `Branch ${index + 2}`}
                    address={
                      [extra.address, extra.contactNumber]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    selected={branchIndex === index}
                    inactive={
                      place.isActive === false || extra.isActive === false
                    }
                    onPress={() => selectBranch(index)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.06)',
        }}
      >
        {campaign && phase !== 'ended' ? (
          <Pressable
            testID="where-reminder"
            onPress={onReminder}
            disabled={reminderPending}
            style={{
              flex: 1,
              backgroundColor: theme.color.ink,
              borderRadius: theme.radius.pill,
              paddingVertical: 10,
              alignItems: 'center',
              opacity: reminderPending ? 0.5 : 1,
            }}
          >
            <Text
              variant="small"
              style={{
                fontFamily: theme.font.bold,
                color: theme.color.accentText,
              }}
            >
              {reminderPending ? 'Saving…' : 'Remind me'}
            </Text>
          </Pressable>
        ) : null}
        {showRecord ? (
          <Pressable
            testID="where-record"
            onPress={onRecord}
            style={{
              flex: 1,
              backgroundColor: simple ? theme.color.ink : theme.color.band,
              borderRadius: simple ? theme.radius.pill : theme.radius.md,
              paddingVertical: 10,
              alignItems: 'center',
              borderWidth: simple ? 0 : 1,
              borderColor: theme.color.legacyBorder,
            }}
          >
            <Text
              variant="small"
              style={{
                fontFamily: theme.font.semibold,
                color: simple ? theme.color.accentText : theme.color.label,
              }}
            >
              Record
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          testID="where-directions"
          onPress={onDirections}
          style={{
            flex: 1,
            backgroundColor:
              campaign || simple
                ? theme.color.surface
                : theme.color.directionsBg,
            borderRadius:
              campaign || simple ? theme.radius.pill : theme.radius.md,
            paddingVertical: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.12)',
          }}
        >
          <Text
            variant="small"
            style={{
              fontFamily: theme.font.semibold,
              color:
                campaign || simple
                  ? theme.color.ink
                  : theme.color.directionsText,
            }}
          >
            Directions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * One row in the branches list. Web styles the selected row
 * `bg-[#D1FF52]/45 border-[#B8E83A]`, an unavailable branch greyed with an
 * "Unavailable" tag, and everything else on `bg-slate-50`.
 */
function BranchRow({
  name,
  address,
  selected,
  inactive,
  onPress,
}: {
  name: string;
  address?: string;
  selected: boolean;
  inactive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        backgroundColor: selected
          ? 'rgba(209,255,82,0.45)'
          : inactive
            ? '#F1F5F9'
            : '#F8FAFC',
        borderColor: selected ? '#B8E83A' : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontSize: 12,
            fontFamily: theme.font.semibold,
            color:
              inactive && !selected
                ? theme.color.placeholder
                : theme.color.text,
          }}
        >
          {name}
        </Text>
        {inactive ? (
          <Text style={{ fontSize: 10, color: theme.color.placeholder }}>
            Unavailable
          </Text>
        ) : null}
      </View>
      {address ? (
        <Text
          numberOfLines={1}
          style={{ fontSize: 11, color: theme.color.textMuted }}
        >
          {address}
        </Text>
      ) : null}
    </Pressable>
  );
}

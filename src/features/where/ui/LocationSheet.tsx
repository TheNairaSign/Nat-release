import { Image, Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';

import type { WherePlace } from '@/core/where';
import { useTheme } from '@/shared/theme';
import { CloseGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

const PHASE_CARD = {
  live: { bg: '#E8F9E4', label: 'Diversion event' },
  upcoming: { bg: '#FFF9E8', label: 'Upcoming event' },
  ended: { bg: '#F3F4F6', label: 'Ended event' },
} as const;

export function LocationSheet({
  place,
  reminderPending,
  onClose,
  onRecord,
  onDirections,
  onReminder,
}: {
  place: WherePlace;
  reminderPending?: boolean;
  onClose: () => void;
  onRecord: () => void;
  onDirections: () => void;
  onReminder?: () => void;
}) {
  const theme = useTheme();
  const [descOpen, setDescOpen] = useState(false);
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
  const images = place.images ?? [];
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
        <Image
          source={{ uri: images[0] }}
          style={{ width: '100%', height: 144 }}
        />
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
          {campaign ? (
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.bold,
                textTransform: 'uppercase',
                marginBottom: 4,
                color: theme.color.label,
              }}
            >
              {phaseUi.label}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: simple || campaign ? 20 : 18,
              fontFamily: theme.font.bold,
              color: theme.color.text,
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
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderWidth: 1,
                  borderColor: theme.color.legacyBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: theme.font.semibold,
                    color: theme.color.label,
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
        {(place.acceptedSubtypes ?? []).length > 0 ? (
          <Text variant="caption" muted>
            Accepted: {(place.acceptedSubtypes ?? []).slice(0, 5).join(', ')}
          </Text>
        ) : null}
        {place.address ? (
          <Text variant="small" muted>
            {place.address}
          </Text>
        ) : null}
        {place.contactNumber ? (
          <Text variant="small" muted>
            {place.contactNumber}
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
        {(place.extraLocations ?? []).map((branch) => (
          <Text key={`${branch.name}-${branch.lat}`} variant="small" muted>
            {branch.name}
            {branch.address ? ` · ${branch.address}` : ''}
          </Text>
        ))}
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
              {reminderPending ? 'Sending…' : 'Email reminder'}
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

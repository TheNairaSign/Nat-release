import { Image, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useState, type ReactNode } from 'react';

import type { WhereBranch, WherePlace } from '@/core/where';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChevronGlyph, CloseGlyph } from '@/shared/ui/icons/glyphs';
import { NavMapMarkerGlyph } from '@/shared/ui/icons/navBarGlyphs';
import {
  BellSolidGlyph,
  ClockSolidGlyph,
  GlobeGlyph,
  LocationArrowGlyph,
  MoneyGlyph,
  PhoneGlyph,
  UsersGlyph,
} from '@/shared/ui/icons/whereGlyphs';
import { Text } from '@/shared/ui/Text';

import { AttendButton } from './AttendButton';
import { EventMaterialBlock } from './EventMaterialBlock';

/**
 * The card for a tapped place, ported from web main's WhereMapbox popups: one for a
 * drop-off centre ("Selected Location Details Card"), one for a quick drop-off ("Simple
 * Location Details Card", with branches) and CampaignDetailsCard for events. Each keeps
 * web's own layout — icons beside address, hours and phone, labelled payment / per
 * drop-off / who-can-drop-off, a lime materials panel — rather than one shared list of
 * grey lines.
 */
export function LocationSheet(props: {
  place: WherePlace;
  reminderPending?: boolean;
  onClose: () => void;
  onRecord: () => void;
  onDirections: () => void;
  onReminder?: () => void;
  /** Signed out: "I'll attend" asks them to sign in instead. */
  guest?: boolean;
  onRequireSignIn?: () => void;
  /** Re-centres the map on the chosen branch (web handleSimpleMarkerClick). Null selects
   *  the main location. */
  onFocusBranch?: (coords: { lat: number; lng: number } | null) => void;
  /** Branch pin the user tapped on the map, so the card opens on it. */
  initialBranchIndex?: number | null;
}) {
  if (props.place.kind === 'campaign') return <EventCard {...props} />;
  if (props.place.kind === 'simple') return <QuickDropCard {...props} />;
  return <CentreCard {...props} />;
}

type CardProps = Parameters<typeof LocationSheet>[0];

const SLATE_400 = '#94a3b8';
const SLATE_500 = '#64748b';
const SLATE_600 = '#475569';
const SLATE_700 = '#334155';
const SLATE_900 = '#0f172a';

function websiteUrl(website: string): string {
  return website.startsWith('http') ? website : `https://${website}`;
}

function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function CloseButton({ onPress, color = SLATE_400 }: { onPress: () => void; color?: string }) {
  return (
    <Pressable
      testID="where-sheet-close"
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      hitSlop={8}
      style={{ padding: 6 }}
    >
      <CloseGlyph color={color} size={18} />
    </Pressable>
  );
}

/** Long text clamped to `limit` characters with a "more" / "less" toggle (web line-clamp). */
function Clamped({
  text,
  limit,
  style,
}: {
  text: string;
  limit: number;
  style: { fontSize: number; lineHeight: number; color: string };
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <View>
      <Text style={style}>
        {!long || open ? text : `${text.slice(0, limit).trimEnd()}…`}
      </Text>
      {long ? (
        <Pressable onPress={() => setOpen((v) => !v)} hitSlop={6}>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              fontFamily: theme.font.semibold,
              color: '#1e293b',
              textDecorationLine: 'underline',
            }}
          >
            {open ? 'less' : 'more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** An icon beside a line of detail (address, hours, phone). */
function IconLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
      <View style={{ marginTop: 2 }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}

/** A small grey label over a bold value: Payment, Per drop-off, Who can drop off. */
function Labelled({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontFamily: theme.font.medium, color: SLATE_500 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

// ─── Drop-off centre ────────────────────────────────────────────────────────────

/** Web "Selected Location Details Card": a white card, header with a type badge, big photo
 *  strip, blue/cyan material chips, "Accepted Items", address and website lines, and
 *  Record + Directions as rounded-xl buttons. */
function CentreCard({ place, onClose, onRecord, onDirections }: CardProps) {
  const theme = useTheme();
  const { linking } = usePorts();
  const [primary, secondary] = place.materials;
  const subtypes = place.acceptedSubtypes ?? [];
  const images = place.images ?? [];

  return (
    <View
      testID="where-location-sheet"
      style={{
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        maxHeight: 520,
        boxShadow: '0 20px 60px rgba(148,163,184,0.35)',
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text
              numberOfLines={1}
              style={{ flexShrink: 1, fontSize: 18, fontFamily: theme.font.semibold, color: '#111827' }}
            >
              {place.name}
            </Text>
            {place.tag ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.font.medium,
                    color: '#4b5563',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {place.tag}
                </Text>
              </View>
            ) : null}
          </View>
          {place.organizationName ? (
            <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: theme.font.medium, color: '#6b7280' }}>
              {place.organizationName}
            </Text>
          ) : null}
        </View>
        <CloseButton onPress={onClose} />
      </View>

      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {images.slice(0, 3).map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={{ width: 128, height: 96, borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6' }}
              />
            ))}
          </ScrollView>
        ) : null}

        {primary || secondary ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {primary ? <Chip label={primary} bg="#eff6ff" fg="#1d4ed8" border="#dbeafe" /> : null}
            {secondary ? <Chip label={secondary} bg="#ecfeff" fg="#0e7490" border="#cffafe" /> : null}
          </View>
        ) : null}

        {place.description?.trim() ? (
          <Clamped
            text={place.description.trim()}
            limit={140}
            style={{ fontSize: 14, lineHeight: 22, color: '#4b5563' }}
          />
        ) : null}

        {subtypes.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: theme.font.semibold,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              Accepted Items
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {subtypes.slice(0, 5).map((subtype) => (
                <View
                  key={subtype}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: '#f9fafb',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#4b5563' }}>{subtype}</Text>
                </View>
              ))}
              {subtypes.length > 5 ? (
                <Text style={{ fontSize: 12, fontFamily: theme.font.medium, color: '#9ca3af' }}>
                  +{subtypes.length - 5}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {place.address || place.website ? (
          <View style={{ gap: 12 }}>
            {place.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <IconDisc>
                  <NavMapMarkerGlyph color="#9ca3af" size={10} />
                </IconDisc>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: '#4b5563' }}>
                  {place.address}
                </Text>
              </View>
            ) : null}
            {place.website ? (
              <Pressable
                testID="where-website"
                onPress={() => void linking.openUrl(websiteUrl(place.website!))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <IconDisc>
                  <GlobeGlyph color="#9ca3af" size={10} />
                </IconDisc>
                <Text style={{ fontSize: 14, fontFamily: theme.font.medium, color: '#2563eb' }}>
                  Visit Website
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 }}>
        <Pressable
          testID="where-record"
          onPress={onRecord}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: theme.font.medium, color: SLATE_700 }}>Record</Text>
        </Pressable>
        <Pressable
          testID="where-directions"
          onPress={onDirections}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#e0f2fe',
            borderWidth: 1,
            borderColor: '#bae6fd',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <LocationArrowGlyph color="#075985" size={12} />
          <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#075985' }}>
            Directions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function IconDisc({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
      }}
    >
      {children}
    </View>
  );
}

function Chip({ label, bg, fg, border }: { label: string; bg: string; fg: string; border: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 12, fontFamily: theme.font.medium, color: fg }}>{label}</Text>
    </View>
  );
}

// ─── Quick drop-off ─────────────────────────────────────────────────────────────

/** Web "Simple Location Details Card": title + tag chip, an "Unavailable" note with the
 *  view count, branches, small thumbnails, the lime materials panel, then a two-column
 *  block — address / hours / phone on the left, payment / per drop-off / who / website on
 *  the right — and Record + Directions as pills. Branch fields follow the chosen branch. */
function QuickDropCard({
  place,
  onClose,
  onRecord,
  onDirections,
  onFocusBranch,
  initialBranchIndex = null,
}: CardProps) {
  const theme = useTheme();
  const { linking } = usePorts();
  const { height: windowHeight } = useWindowDimensions();
  const branches = place.extraLocations ?? [];
  const [branchesOpen, setBranchesOpen] = useState(initialBranchIndex !== null);
  const [branchIndex, setBranchIndex] = useState<number | null>(initialBranchIndex);
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const branch: WhereBranch | null = branchIndex === null ? null : (branches[branchIndex] ?? null);
  const onBranch = branch !== null;

  const selectBranch = (index: number | null) => {
    setBranchIndex(index);
    const target = index === null ? null : branches[index];
    onFocusBranch?.(target ? { lat: target.lat, lng: target.lng } : null);
  };

  const title = onBranch ? branch.name || `Branch ${branchIndex! + 2}` : place.name;
  const phone = onBranch ? branch.contactNumber : place.contactNumber;
  const address = onBranch ? branch.address : place.address;
  const who = onBranch ? branch.whoCanDropOff : place.whoCanDropOff;
  const paymentNote = (onBranch ? branch.paymentNote || place.paymentNote : place.paymentNote)?.trim();
  const viewCount = onBranch ? (branch.viewCount ?? 0) : (place.viewCount ?? 0);
  const hours = place.hours?.trim();
  const website = !onBranch ? place.website : undefined;
  const hasUnits = place.maxItemsPerDropOff != null;
  const unavailable = place.isActive === false || (onBranch && branch.isActive === false);
  const thumbnails = onBranch && branch.images?.length ? branch.images : (place.images ?? []);
  const materials = place.bulkMaterials?.length ? place.bulkMaterials : place.materials;

  const hasLeft = Boolean(address || hours || phone);
  const hasRight = Boolean(paymentNote || hasUnits || who?.trim() || website);

  const left = (
    <View style={{ gap: 10, minWidth: 0 }}>
      {address ? (
        <IconLine icon={<NavMapMarkerGlyph color={SLATE_400} size={12} />}>
          <Text style={{ fontSize: 12, lineHeight: 16, color: SLATE_700 }}>{address}</Text>
        </IconLine>
      ) : null}
      {hours ? (
        <IconLine icon={<ClockSolidGlyph color={SLATE_400} size={12} />}>
          <Clamped text={hours} limit={90} style={{ fontSize: 12, lineHeight: 16, color: SLATE_700 }} />
        </IconLine>
      ) : null}
      {phone ? (
        <Pressable testID="where-phone" onPress={() => void linking.openUrl(telUrl(phone))}>
          <IconLine icon={<PhoneGlyph color={SLATE_400} size={11} />}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: theme.font.semibold, color: SLATE_900 }}>
              {phone}
            </Text>
          </IconLine>
        </Pressable>
      ) : null}
    </View>
  );

  const right = (
    <View style={{ gap: 10, minWidth: 0 }}>
      {paymentNote ? (
        <Labelled label="Payment">
          <Text style={{ fontSize: 13, lineHeight: 17, fontFamily: theme.font.semibold, color: SLATE_900 }}>
            {paymentNote}
          </Text>
        </Labelled>
      ) : null}
      {hasUnits ? (
        <Labelled label="Per drop-off">
          <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: SLATE_900 }}>
            {place.maxItemsPerDropOff}
            {place.maxItemsUnit ? ` ${place.maxItemsUnit}` : ''}
          </Text>
        </Labelled>
      ) : null}
      {who?.trim() ? (
        <Labelled label="Who can drop off">
          <Text style={{ fontSize: 13, lineHeight: 17, fontFamily: theme.font.semibold, color: SLATE_900 }}>
            {who}
          </Text>
        </Labelled>
      ) : null}
      {website ? (
        <Pressable
          testID="where-website"
          onPress={() => void linking.openUrl(websiteUrl(website))}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <GlobeGlyph color={SLATE_500} size={11} />
          <Text style={{ fontSize: 12, fontFamily: theme.font.medium, color: SLATE_700 }}>Website</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View
      testID="where-location-sheet"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxHeight: Math.min(windowHeight * 0.58, 480),
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 21.6,
              lineHeight: 26,
              fontFamily: theme.font.bold,
              color: '#111111',
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {place.tag ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: '#f1f5f9',
                  borderWidth: 1,
                  borderColor: 'rgba(226,232,240,0.8)',
                }}
              >
                <Text style={{ fontSize: 11, fontFamily: theme.font.semibold, color: SLATE_700 }}>
                  {place.tag}
                </Text>
              </View>
            ) : null}
            {place.organizationName ? (
              <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 12, color: SLATE_500 }}>
                {place.organizationName}
              </Text>
            ) : null}
          </View>
        </View>
        <CloseButton onPress={onClose} color={SLATE_400} />
      </View>

      {unavailable ? (
        <View
          testID="where-unavailable"
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            borderRadius: 12,
            backgroundColor: '#f1f5f9',
            borderWidth: 1,
            borderColor: 'rgba(226,232,240,0.8)',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: SLATE_700 }}>
            Unavailable right now. Check back later.
          </Text>
          <Text style={{ marginTop: 4, fontSize: 11, color: SLATE_500 }}>
            {viewCount} view{viewCount === 1 ? '' : 's'}
          </Text>
        </View>
      ) : null}

      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 12 }}>
        {branches.length > 0 ? (
          <View>
            <Pressable
              testID="where-branches-toggle"
              onPress={() => setBranchesOpen((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: SLATE_700 }}>
                Branches ({branches.length + 1})
              </Text>
              <ChevronGlyph color={SLATE_500} size={14} direction={branchesOpen ? 'up' : 'down'} />
            </Pressable>
            {branchesOpen ? (
              <View style={{ marginTop: 8, gap: 4 }}>
                <BranchRow
                  name={place.name}
                  detail={place.address}
                  selected={branchIndex === null}
                  inactive={false}
                  onPress={() => selectBranch(null)}
                />
                {branches.map((extra, index) => (
                  <BranchRow
                    key={`branch-${index}`}
                    name={extra.name || `Branch ${index + 2}`}
                    detail={[extra.address, extra.contactNumber].filter(Boolean).join(' · ') || undefined}
                    selected={branchIndex === index}
                    inactive={place.isActive === false || extra.isActive === false}
                    onPress={() => selectBranch(index)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {thumbnails.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {thumbnails.slice(0, 3).map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={{ width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
              />
            ))}
            {thumbnails.length > 3 ? (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <Text style={{ fontSize: 10, fontFamily: theme.font.semibold, color: SLATE_600 }}>
                  +{thumbnails.length - 3}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ borderRadius: 16, backgroundColor: 'rgba(209,255,82,0.35)', padding: 10 }}>
          {materials.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {(showAllMaterials ? materials : materials.slice(0, 4)).map((material) => (
                <View
                  key={material}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: '#D1FF52',
                    borderWidth: 1,
                    borderColor: 'rgba(184,232,58,0.8)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#1A1A1A' }}>
                    {material}
                  </Text>
                </View>
              ))}
              {materials.length > 4 ? (
                <Pressable
                  testID="where-materials-more"
                  onPress={() => setShowAllMaterials((v) => !v)}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 11, fontFamily: theme.font.semibold, color: SLATE_700, paddingHorizontal: 4 }}>
                    {showAllMaterials ? 'less' : `+${materials.length - 4}`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: SLATE_600, paddingHorizontal: 4 }}>No materials listed</Text>
          )}
        </View>

        {place.description?.trim() ? (
          <Clamped
            text={place.description.trim()}
            limit={120}
            style={{ fontSize: 13, lineHeight: 20, color: SLATE_600 }}
          />
        ) : null}

        {hasLeft && hasRight ? (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(226,232,240,0.9)' }}>
              {left}
            </View>
            <View style={{ flex: 1, paddingLeft: 12 }}>{right}</View>
          </View>
        ) : hasLeft ? (
          left
        ) : hasRight ? (
          right
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        }}
      >
        {!unavailable && place.record ? (
          <Pressable
            testID="where-record"
            onPress={onRecord}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: '#1A1A1A', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#ffffff' }}>Record</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID="where-directions"
          onPress={onDirections}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.15)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <LocationArrowGlyph color="#1A1A1A" size={12} />
          <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1A1A1A' }}>Directions</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** One row in the branches list: the chosen one lime, an unavailable one greyed. */
function BranchRow({
  name,
  detail,
  selected,
  inactive,
  onPress,
}: {
  name: string;
  detail?: string;
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
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: selected ? 'rgba(209,255,82,0.45)' : inactive ? '#f1f5f9' : '#f8fafc',
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
            color: inactive && !selected ? SLATE_400 : selected ? SLATE_900 : SLATE_700,
          }}
        >
          {name}
        </Text>
        {inactive ? <Text style={{ fontSize: 10, color: SLATE_400 }}>Unavailable</Text> : null}
      </View>
      {detail ? (
        <Text numberOfLines={1} style={{ fontSize: 11, color: SLATE_500 }}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── Event ──────────────────────────────────────────────────────────────────────

/** Web CampaignDetailsCard's PHASE_UI. */
const PHASE_UI = {
  live: {
    label: 'Diversion event',
    badgeBg: '#059669',
    badgeText: '#ffffff',
    title: '#065F46',
    accent: '#047857',
    cardBg: '#E8F9E4',
    cardBorder: 'rgba(167,243,208,0.6)',
  },
  upcoming: {
    label: 'Upcoming event',
    badgeBg: '#F5D74D',
    badgeText: '#1A1A1A',
    title: '#8A6E0F',
    accent: '#9A7C12',
    cardBg: '#FFF9E8',
    cardBorder: 'rgba(245,215,77,0.5)',
  },
  ended: {
    label: 'Ended event',
    badgeBg: '#6B7280',
    badgeText: '#ffffff',
    title: '#6B7280',
    accent: '#9CA3AF',
    cardBg: '#F3F4F6',
    cardBorder: 'rgba(0,0,0,0.05)',
  },
} as const;

/** Web CampaignDetailsCard: phase-tinted card, cover photo with the phase badge, then
 *  schedule / who / phone / payment each beside its icon, the description, the lime
 *  materials block, the address, "I'll attend", and Remind me + Directions. */
function EventCard({
  place,
  reminderPending,
  onClose,
  onDirections,
  onReminder,
  guest = false,
  onRequireSignIn,
  initialBranchIndex = null,
}: CardProps) {
  const theme = useTheme();
  const { linking } = usePorts();
  const phase = place.phase ?? 'live';
  const ui = PHASE_UI[phase];
  const ended = phase === 'ended';
  const cover = place.images?.[0];
  // An event held in several places: the card names the one whose pin was tapped.
  const spot = initialBranchIndex === null ? null : place.extraLocations?.[initialBranchIndex];
  const address = spot?.address ?? place.address;
  const iconColor = ui.accent;

  return (
    <View
      testID="where-location-sheet"
      style={{
        backgroundColor: ui.cardBg,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: ui.cardBorder,
        overflow: 'hidden',
        maxHeight: 540,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      {cover ? (
        <View style={{ height: 144, width: '100%', backgroundColor: '#F5E6CC', opacity: ended ? 0.8 : 1 }}>
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 72, backgroundColor: 'rgba(0,0,0,0.28)' }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: ui.badgeBg,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.bold,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: ui.badgeText,
              }}
            >
              {ui.label}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {!cover ? (
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.bold,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 4,
                color: ui.title,
              }}
            >
              {ui.label}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 16,
              lineHeight: 22,
              fontFamily: theme.font.bold,
              color: ended ? '#4B5563' : SLATE_900,
            }}
          >
            {place.name}
          </Text>
          {spot?.name ? (
            <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: SLATE_500 }}>
              {spot.name}
            </Text>
          ) : null}
        </View>
        <CloseButton onPress={onClose} color={SLATE_500} />
      </View>

      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
        {place.schedule ? (
          <IconLine icon={<ClockSolidGlyph color={iconColor} size={12} />}>
            <Text style={{ fontSize: 12, lineHeight: 18, color: SLATE_700 }}>
              {place.schedule}
              {place.hours ? ` · ${place.hours}` : ''}
            </Text>
          </IconLine>
        ) : null}
        {place.whoCanAttend ? (
          <IconLine icon={<UsersGlyph color={iconColor} size={12} />}>
            <Text style={{ fontSize: 12, lineHeight: 18, color: SLATE_700 }}>{place.whoCanAttend}</Text>
          </IconLine>
        ) : null}
        {place.contactNumber ? (
          <Pressable testID="where-phone" onPress={() => void linking.openUrl(telUrl(place.contactNumber!))}>
            <IconLine icon={<PhoneGlyph color={iconColor} size={12} />}>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 18,
                  fontFamily: theme.font.medium,
                  color: SLATE_700,
                  textDecorationLine: 'underline',
                }}
              >
                {place.contactNumber}
              </Text>
            </IconLine>
          </Pressable>
        ) : null}
        {place.paymentNote ? (
          <IconLine icon={<MoneyGlyph color={iconColor} size={12} />}>
            <Text style={{ fontSize: 12, lineHeight: 18, color: SLATE_700 }}>{place.paymentNote}</Text>
          </IconLine>
        ) : null}

        {place.description?.trim() ? (
          <Clamped
            text={place.description.trim()}
            limit={140}
            style={{ fontSize: 13, lineHeight: 20, color: ended ? '#6b7280' : SLATE_600 }}
          />
        ) : null}

        <EventMaterialBlock materials={place.materials} />

        {address ? (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: SLATE_500,
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.06)',
              paddingTop: 12,
            }}
          >
            {address}
          </Text>
        ) : null}

        {!ended ? (
          <AttendButton campaignId={place.id} guest={guest} onRequireSignIn={onRequireSignIn} />
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
          {!ended ? (
            <Pressable
              testID="where-reminder"
              onPress={onReminder}
              disabled={reminderPending}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: '#1A1A1A',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: reminderPending ? 0.5 : 1,
              }}
            >
              <BellSolidGlyph color="#ffffff" size={12} />
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#ffffff' }}>
                {reminderPending ? 'Saving…' : 'Remind me'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            testID="where-directions"
            onPress={onDirections}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LocationArrowGlyph color={ended ? '#374151' : '#1A1A1A'} size={12} />
            <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: ended ? '#374151' : '#1A1A1A' }}>
              Directions
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

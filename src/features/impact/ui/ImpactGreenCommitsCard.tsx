import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  ANNUAL_DAYS_GOAL,
  MONTH_NAMES,
  canGoNext,
  monthHeatWeeks,
  yearHeatRows,
  type GridCell,
} from '@/core/impact';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Port of client/src/pages/dashboard/components/ImpactGreenCommitsCard.tsx.
 *
 * Restores four things the previous inline version dropped:
 *  - the month/year view toggle and the ‹ › period stepper (clamped to today)
 *  - the "CU Goal" caption and the 0 / 365 axis labels
 *  - the active-day count rendered *inside* the progress fill
 *  - a real 7-row week grid; the old one used flexWrap, which reflowed the
 *    year into an arbitrary shape
 */
export function ImpactGreenCommitsCard({
  counts,
  activeDays,
  totalDiversions,
  allTimeCarbonUnits,
  loading = false,
  now = new Date(),
}: {
  counts: Record<string, number>;
  activeDays: number;
  totalDiversions: number;
  allTimeCarbonUnits: number;
  loading?: boolean;
  now?: Date;
}) {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('year');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tip, setTip] = useState<GridCell | null>(null);

  const rows = useMemo(() => yearHeatRows(year, counts), [year, counts]);
  const weeks = useMemo(
    () => monthHeatWeeks(year, month, counts),
    [year, month, counts],
  );

  const progress = Math.min((activeDays / ANNUAL_DAYS_GOAL) * 100, 100);
  const nextEnabled = canGoNext(viewMode, year, month, now);

  const goPrev = () => {
    if (viewMode === 'month') {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else setYear((y) => y - 1);
  };

  const goNext = () => {
    if (!nextEnabled) return;
    if (viewMode === 'month') {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    } else setYear((y) => y + 1);
  };

  const cellColor = (cell: GridCell) =>
    cell.level === 0
      ? theme.color.heatEmpty
      : cell.level === 1
        ? theme.color.heatLow
        : cell.level === 2
          ? theme.color.heatMid
          : theme.color.commitFill;

  return (
    <View
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card28,
        borderWidth: 1,
        borderColor: theme.color.borderSolid,
        padding: 16,
        minHeight: 440,
      }}
    >
      {/* Header: view toggle on the left, ‹ label › on the right */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Pressable
          testID="commits-view-toggle"
          onPress={() => setViewMode((v) => (v === 'month' ? 'year' : 'month'))}
          style={{
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.color.borderSolid,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: theme.color.text }}>
            {viewMode === 'year' ? 'Month view' : 'Year view'}
          </Text>
        </Pressable>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Pressable
            testID="commits-prev"
            onPress={goPrev}
            hitSlop={8}
            style={{ padding: 6 }}
          >
            <ChevronGlyph
              color={theme.color.textMuted}
              size={14}
              direction="left"
            />
          </Pressable>
          <Text
            style={{
              fontSize: 13,
              color: theme.color.text,
              minWidth: 72,
              textAlign: 'center',
            }}
          >
            {viewMode === 'month'
              ? `${MONTH_NAMES[month]} ${year}`
              : String(year)}
          </Text>
          <Pressable
            testID="commits-next"
            onPress={goNext}
            hitSlop={8}
            disabled={!nextEnabled}
            style={{ padding: 6, opacity: nextEnabled ? 1 : 0.35 }}
          >
            <ChevronGlyph
              color={theme.color.textMuted}
              size={14}
              direction="right"
            />
          </Pressable>
        </View>
      </View>

      {/* Progress toward the 365-day goal */}
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
            {loading
              ? 'Loading…'
              : `${totalDiversions} waste diversions in ${year}`}
          </Text>
          <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
            CU Goal
          </Text>
        </View>

        <View
          style={{
            height: 24,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.limeTrack,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              // web: width: max(progressPercentage, uniqueDays ? 8 : 0)%
              width: `${Math.max(progress, activeDays > 0 ? 8 : 0)}%`,
              minWidth: activeDays > 0 ? 32 : 0,
              height: '100%',
              backgroundColor: theme.color.ink,
              borderRadius: theme.radius.pill,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingHorizontal: 8,
            }}
          >
            {activeDays > 0 ? (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: theme.font.bold,
                  color: '#ffffff',
                }}
              >
                {activeDays}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 11, color: theme.color.textMuted }}>0</Text>
          <Text style={{ fontSize: 11, color: theme.color.textMuted }}>
            {ANNUAL_DAYS_GOAL}
          </Text>
        </View>
      </View>

      {viewMode === 'month' ? (
        <View>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <Text
                key={`${d}-${i}`}
                style={{
                  flex: 1,
                  fontSize: 10,
                  color: theme.color.placeholder,
                  textAlign: 'center',
                  paddingBottom: 2,
                }}
              >
                {d}
              </Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View
              key={wi}
              style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}
            >
              {week.map((cell, ci) =>
                cell ? (
                  <Pressable
                    key={cell.key}
                    onPress={() => setTip(cell)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 6,
                      backgroundColor: cellColor(cell),
                    }}
                  />
                ) : (
                  <View
                    key={`e-${wi}-${ci}`}
                    style={{ flex: 1, aspectRatio: 1 }}
                  />
                ),
              )}
            </View>
          ))}
        </View>
      ) : (
        // 7 rows of 11px cells, scrolled horizontally — the web `overflow-x-auto`
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ gap: 3 }}>
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 3 }}>
                {row.map((cell, ci) => (
                  <Pressable
                    key={`${cell.key}-${ci}`}
                    disabled={!cell.inPeriod}
                    onPress={() => setTip(cell)}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      backgroundColor: cell.inPeriod
                        ? cellColor(cell)
                        : 'transparent',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {tip ? (
        <Pressable
          testID="commits-tooltip"
          onPress={() => setTip(null)}
          style={{
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: '#000000',
            borderRadius: theme.radius.md,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontFamily: theme.font.semibold }}>
            {tip.date.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={{ color: '#ffffff' }}>Drop-offs: {tip.count}</Text>
        </Pressable>
      ) : null}

      <Text variant="small" style={{ marginTop: 16 }}>
        All time: {Math.floor(allTimeCarbonUnits).toLocaleString()}CU
      </Text>
    </View>
  );
}

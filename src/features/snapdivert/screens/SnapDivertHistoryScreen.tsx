import { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CONDITION_WORDS,
  buildSnapDivertChat,
  type SnapItem,
  type SnapStatus,
} from '@/core/snapdivert';
import { askDivaWith } from '@/features/ai';
import {
  GroceryAppHeader,
  GroceryHeaderPrimary,
  UndoBar,
  createSwipeResponder,
} from '@/features/grocery';
import { useQuery, useQueryClient } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { listSnapItems, snapKeys, snapStats, updateSnapItem } from '../api/snapdivert-api';

/** How far a row must travel, as a share of its width, for letting go to count. */
const SETTLE_AT = 0.33;

/**
 * One item in History (prototype "Scandiverter – history"): swipe right once it's been
 * diverted, left once it went to landfill. Acts on release; the page offers Undo.
 */
function SnapItemRow({
  item,
  onSettle,
  onDivert,
}: {
  item: SnapItem;
  onSettle: (status: Exclude<SnapStatus, 'pending'>) => void;
  onDivert: () => void;
}) {
  const theme = useTheme();
  const { haptics } = usePorts();
  const [width, setWidth] = useState(320);
  const [dx, setDx] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const settled = item.status !== 'pending';
  const pan = useMemo(
    () =>
      createSwipeResponder({
        x,
        width,
        enabled: !settled,
        usedAt: SETTLE_AT,
        deleteAt: SETTLE_AT,
        onDrag: setDx,
        onArm: () => haptics.light(),
        onCommit: (commit) => onSettle(commit === 'used' ? 'diverted' : 'disposed'),
      }),
    [x, width, settled, haptics, onSettle],
  );

  return (
    <View testID={`snap-row-${item._id}`} onLayout={(e) => setWidth(e.nativeEvent.layout.width || 320)} style={{ borderRadius: 24, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 24,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: dx > 0 ? '#1B7A3D' : dx < 0 ? '#A31621' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#ffffff', opacity: dx > 0 ? 1 : 0 }}>Diverted</Text>
        <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#ffffff', opacity: dx < 0 ? 1 : 0 }}>Landfill</Text>
      </View>
      <Animated.View
        {...pan.panHandlers}
        style={{
          transform: [{ translateX: x }],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#E6E6E6',
          backgroundColor: '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 14,
          opacity: settled ? 0.7 : 1,
        }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#D3FF5D', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontFamily: theme.font.bold, color: '#14361B' }}>{item.tag}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#010B02', textTransform: 'capitalize' }}>{item.name}</Text>
          <Text style={{ marginTop: 2, fontSize: 14, color: '#1E0D2A' }}>
            Condition : {item.condition ? CONDITION_WORDS[item.condition] : 'not set'}
          </Text>
          <View style={{ marginTop: 4, flexDirection: 'row' }}>
            {settled ? (
              <Text style={{ fontSize: 12, color: item.status === 'diverted' ? '#198754' : '#A31621' }}>
                {item.status === 'diverted' ? 'Diverted' : 'Went to landfill'}
              </Text>
            ) : (
              <Pressable testID={`snap-row-divert-${item._id}`} onPress={onDivert}>
                <Text style={{ fontSize: 12, color: '#198754', textDecorationLine: 'underline' }}>How to divert?</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * SnapDivert History (web SnapDivertHistory.tsx): the last 30 days, diverted against
 * landfilled, then every snapped item. "All" is what's still to settle; "History" what
 * has been.
 */
export function SnapDivertHistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation } = usePorts();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'all' | 'history'>('all');
  const [undo, setUndo] = useState<{ item: SnapItem; status: SnapStatus } | null>(null);
  const itemsQuery = useQuery({ queryKey: snapKeys.items, queryFn: () => listSnapItems(http).catch(() => []) });
  const statsQuery = useQuery({ queryKey: snapKeys.stats, queryFn: () => snapStats(http).catch(() => null) });
  const items = itemsQuery.data;
  const stats = statsQuery.data ?? null;

  const setItems = (update: (list: SnapItem[]) => SnapItem[]) =>
    queryClient.setQueryData<SnapItem[]>(snapKeys.items, (prev) => update(prev ?? []));

  async function settle(item: SnapItem, status: SnapStatus) {
    setItems((list) => list.map((i) => (i._id === item._id ? { ...i, status } : i)));
    try {
      await updateSnapItem(http, item._id, { status });
      if (status !== 'pending') setUndo({ item, status });
      void queryClient.invalidateQueries({ queryKey: snapKeys.stats });
    } catch {
      setItems((list) => list.map((i) => (i._id === item._id ? item : i)));
    }
  }

  const shown = (items ?? []).filter((i) => (view === 'all' ? i.status === 'pending' : i.status !== 'pending'));
  const settledTotal = stats ? stats.diverted + stats.disposed : 0;
  const snap = () => navigation.replace('/snapdivert');

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GroceryAppHeader title="ScanDiverter" right={<GroceryHeaderPrimary label="Snap" onPress={snap} />} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 + insets.bottom }}>
        {stats && settledTotal > 0 ? (
          <View testID="snap-stats" style={{ marginTop: 12, borderRadius: 24, borderWidth: 1, borderColor: '#E6E6E6', backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#010B02', textTransform: 'uppercase' }}>Last 30 days</Text>
              {stats.savedShare !== null ? (
                <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#010B02' }}>{Math.round(stats.savedShare * 100)}% saved</Text>
              ) : null}
            </View>
            <View style={{ marginTop: 10, height: 9, flexDirection: 'row', overflow: 'hidden', borderRadius: 999 }}>
              <View style={{ flex: stats.diverted, backgroundColor: '#6C9E6A' }} />
              <View style={{ flex: stats.disposed, backgroundColor: '#9B3E3A' }} />
            </View>
            <Text style={{ marginTop: 8, fontSize: 12, color: '#408558' }}>
              {stats.diverted} diverted . {stats.disposed} landfilled
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 20, flexDirection: 'row', gap: 32, paddingHorizontal: 4 }}>
          {(
            [
              ['all', 'All'],
              ['history', 'History'],
            ] as const
          ).map(([key, label]) => (
            <Pressable key={key} testID={`snap-tab-${key}`} onPress={() => setView(key)}>
              <Text style={{ fontSize: 15, color: view === key ? '#010B02' : 'rgba(1,11,2,0.7)', fontFamily: view === key ? theme.font.bold : theme.font.regular }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ marginTop: 12, paddingHorizontal: 4, fontSize: 12, fontStyle: 'italic', color: '#64748B' }}>
          Swipe left if disposed and right if diverted
        </Text>

        {items === undefined ? (
          <Text style={{ paddingVertical: 40, textAlign: 'center', fontSize: 14, color: '#64748B' }}>Loading…</Text>
        ) : shown.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
              {view === 'all' ? 'Nothing waiting' : 'Nothing settled yet'}
            </Text>
            <Pressable onPress={snap} style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#D1FF52', paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>Snap something</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            {shown.map((item) => (
              <SnapItemRow
                key={item._id}
                item={item}
                onSettle={(status) => void settle(item, status)}
                onDivert={() => {
                  const chat = buildSnapDivertChat(item);
                  askDivaWith(chat.question, chat.context);
                  navigation.navigate('/ai');
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {undo ? (
        <UndoBar
          bottom={16 + insets.bottom}
          message={`${undo.item.name} marked ${undo.status === 'diverted' ? 'diverted' : 'landfilled'}`}
          onUndo={() => {
            void settle(undo.item, 'pending');
            setUndo(null);
          }}
          onDismiss={() => setUndo(null)}
        />
      ) : null}
    </View>
  );
}

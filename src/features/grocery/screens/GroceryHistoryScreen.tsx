import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildDivertContext,
  buildDivertQuestion,
  buildUseUpRequest,
  daysUntil,
  recycleHref,
  type GroceryItem,
  type GroceryItemStatus,
  type GroceryScan,
} from '@/core/grocery';
import { askDivaWith, openChatSection } from '@/features/ai';
import { useQuery, useQueryClient } from '@/shared/api';
import { readHttpErrorMessage } from '@/shared/api/errors';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

import {
  groceryKeys,
  listScans,
  rejoinItems,
  settleItems,
  updateItem,
  wasteStats,
} from '../api/grocery-api';
import { GroceryAppHeader, GroceryHeaderLink, GroceryNewScan } from '../ui/GroceryAppHeader';
import { GroceryDivaBar } from '../ui/GroceryDivaBar';
import {
  ExpiryDatePicker,
  ItemActionsSheet,
  SettleCountSheet,
  UndoBar,
  type SettleStatus,
} from '../ui/GrocerySheets';
import { HistoryItemRow } from '../ui/HistoryItemRow';

/** "Today", "Yesterday", or a plain date: how people refer to a past shop. */
export function scanDate(iso: string, today = new Date()): string {
  const days = -daysUntil(iso, today);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: new Date(iso).getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

/** "4 items", or "5 items · 4 groups" when duplicates were combined. */
export function scanCount(scan: GroceryScan): string {
  const groups = scan.items.length;
  const items = scan.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return items === groups ? plural(items, 'item') : `${plural(items, 'item')} · ${plural(groups, 'group')}`;
}

/** The stats card's bar: 25 sticks, green for the share diverted, red for the rest. */
const STICKS = 25;

type Undo = { item: GroceryItem; status: GroceryItemStatus; count: number; split?: GroceryItem };

/**
 * The Grocery Manager's list (prototype Flow 3, "Current list"; web GroceryHistory.tsx):
 * the last 30 days' summary, "Make a recipe", then Expiring (everything still to use,
 * soonest first) or History (by shop). Swipe a card to settle it, with Undo; tap it for
 * the rest. The DiVA bar runs along the foot.
 */
export function GroceryHistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation, location } = usePorts();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'expiring' | 'history'>('expiring');
  const [acting, setActing] = useState<GroceryItem | null>(null);
  const [picking, setPicking] = useState<GroceryItem | null>(null);
  const [counting, setCounting] = useState<{ item: GroceryItem; status: SettleStatus } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // The list and the 30-day summary arrive together, so the page lands in one piece.
  const scansQuery = useQuery({ queryKey: groceryKeys.scans, queryFn: () => listScans(http) });
  const statsQuery = useQuery({
    queryKey: groceryKeys.stats('month'),
    // The summary is a bonus; the list matters more.
    queryFn: () => wasteStats(http, 'month').catch(() => null),
  });
  const loading = scansQuery.isPending || statsQuery.isPending;
  const scans = useMemo(() => scansQuery.data ?? [], [scansQuery.data]);
  const stats = statsQuery.data ?? null;

  const setScans = (update: (prev: GroceryScan[]) => GroceryScan[]) =>
    queryClient.setQueryData<GroceryScan[]>(groceryKeys.scans, (prev) => update(prev ?? []));
  /** Replace one item wherever it sits, so the page doesn't reload. */
  const patchItem = (id: string, changes: Partial<GroceryItem>) =>
    setScans((prev) =>
      prev.map((scan) => ({
        ...scan,
        items: scan.items.map((item) => (item._id === id ? { ...item, ...changes } : item)),
      })),
    );
  const refreshStats = () =>
    void queryClient.invalidateQueries({ queryKey: groceryKeys.stats('month') });
  const fail = (error: unknown, fallback: string) => setProblem(readHttpErrorMessage(error, fallback));

  const expiring = useMemo(
    () =>
      scans
        .flatMap((scan) => scan.items)
        .filter((item) => !item.status || item.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.expiresOn).getTime() - new Date(b.expiresOn).getTime() || a.tag - b.tag,
        ),
    [scans],
  );

  async function toggleReminder(item: GroceryItem) {
    const next = item.remindersEnabled === false;
    patchItem(item._id, { remindersEnabled: next }); // animate first, save after
    try {
      await updateItem(http, item._id, { remindersEnabled: next });
    } catch (error) {
      patchItem(item._id, { remindersEnabled: !next });
      fail(error, 'Could not change reminders');
    }
  }

  async function saveDate(date: string) {
    if (!picking) return;
    setBusyId(picking._id);
    try {
      patchItem(picking._id, await updateItem(http, picking._id, { expiresOn: date }));
      setPicking(null);
    } catch (error) {
      fail(error, 'Could not save that date');
    } finally {
      setBusyId(null);
    }
  }

  /** A swipe settles straight away (no confirmation, Undo instead). */
  async function settle(item: GroceryItem, status: SettleStatus, count = item.quantity ?? 1) {
    const quantity = item.quantity ?? 1;
    if (count < quantity) {
      // Some of a combined row: the rest stay, so wait for the server's split.
      try {
        const { remaining, settled } = await settleItems(http, item._id, status, count);
        setScans((prev) =>
          prev.map((scan) =>
            scan.cartId !== item.cartId
              ? scan
              : {
                  ...scan,
                  items: [
                    ...scan.items.map((i) => (i._id === item._id && remaining ? remaining : i)),
                    settled,
                  ],
                },
          ),
        );
        setUndo({ item, status, count, split: settled });
        refreshStats();
      } catch (error) {
        fail(error, 'Could not update that item');
      }
      return;
    }
    patchItem(item._id, { status, settledAt: new Date().toISOString() });
    setUndo({ item, status, count });
    try {
      patchItem(item._id, await updateItem(http, item._id, { status }));
      refreshStats();
    } catch (error) {
      patchItem(item._id, item);
      setUndo(null);
      fail(error, 'Could not update that item');
    }
  }

  /** Straight away for one item, "how many?" for several. */
  const startSettle = (item: GroceryItem, status: SettleStatus) => {
    if ((item.quantity ?? 1) > 1) setCounting({ item, status });
    else void settle(item, status);
  };

  async function undoSettle() {
    if (!undo) return;
    const { item, split } = undo;
    setUndo(null);
    if (split) {
      try {
        const restored = await rejoinItems(http, split._id);
        setScans((prev) =>
          prev.map((scan) => ({
            ...scan,
            items: scan.items
              .filter((i) => i._id !== split._id)
              .map((i) => (i._id === restored._id ? restored : i)),
          })),
        );
        refreshStats();
      } catch (error) {
        fail(error, 'Could not undo that');
      }
      return;
    }
    patchItem(item._id, { status: 'active', settledAt: null });
    try {
      patchItem(item._id, await updateItem(http, item._id, { status: 'active' }));
      refreshStats();
    } catch (error) {
      patchItem(item._id, item);
      fail(error, 'Could not undo that');
    }
  }

  async function rename(item: GroceryItem, name: string) {
    patchItem(item._id, { name });
    try {
      patchItem(item._id, await updateItem(http, item._id, { name }));
    } catch (error) {
      patchItem(item._id, { name: item.name });
      fail(error, 'Could not rename that item');
    }
  }

  /** "How to divert?" asks DiVA: the answer depends on the thing and where they are. */
  async function divert(item: GroceryItem) {
    const here = await location.getCurrentPosition().catch(() => null);
    const place = here ?? undefined;
    openChatSection('grocery');
    askDivaWith(buildDivertQuestion(item, place), buildDivertContext(item, place));
    navigation.navigate('/ai');
  }

  function makeRecipe() {
    const request = buildUseUpRequest(expiring);
    if (!request) return;
    openChatSection('grocery');
    askDivaWith(request.question, request.context);
    navigation.navigate('/ai');
  }

  const newScan = () => navigation.replace('/ai/grocery');
  const hasStats = !!stats && (stats.used > 0 || stats.wasted > 0);
  const diverted = stats?.savedShare ?? null;
  const greenSticks = diverted === null ? 0 : Math.round(diverted * STICKS);

  const renderRow = (item: GroceryItem) => (
    <HistoryItemRow
      key={item._id}
      item={item}
      busy={busyId === item._id}
      // The photo's numbers only mean something next to the photo.
      showTag={view === 'history'}
      onToggleReminder={() => void toggleReminder(item)}
      onOpen={() => setActing(item)}
      onDivert={() => void divert(item)}
      onUsed={() => startSettle(item, 'consumed')}
      onDelete={() => startSettle(item, 'discarded')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GroceryAppHeader
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <GroceryHeaderLink label="Recipes" onPress={() => navigation.navigate('/grocery/recipes')} />
            <GroceryNewScan onPress={newScan} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 + insets.bottom }}
      >
        {problem ? (
          <Pressable onPress={() => setProblem(null)} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: '#FEE2E2', padding: 10 }}>
            <Text style={{ fontSize: 13, color: '#B91C1C' }}>{problem}</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View testID="grocery-history-skeleton">
            <View style={{ marginTop: 6, height: 160, borderRadius: 38, backgroundColor: '#F1F5F9' }} />
            <View style={{ marginTop: 36, height: 40, borderRadius: 999, backgroundColor: '#F8FAFC' }} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginTop: 12, height: 92, borderRadius: 22, backgroundColor: '#F8FAFC' }} />
            ))}
          </View>
        ) : null}

        {!loading && hasStats && stats ? (
          // web: 160pt card, 38pt corners, a hairline #707070 at 13%
          <View
            testID="grocery-stats"
            style={{
              marginHorizontal: -3,
              marginTop: 6,
              height: 160,
              borderRadius: 38,
              borderWidth: 1,
              borderColor: 'rgba(112,112,112,0.13)',
              backgroundColor: '#ffffff',
            }}
          >
            <Text style={{ position: 'absolute', left: 29, top: 28, fontSize: 12, lineHeight: 12, letterSpacing: 0.96, color: '#1E0D2A' }}>
              Last 30 days
            </Text>
            <Image
              source={require('../../../../assets/images/grocery/groceryBagLine.png')}
              style={{ position: 'absolute', left: 26, top: 46, width: 60, height: 36 }}
            />
            <View style={{ position: 'absolute', right: 31, top: 32 }}>
              <Text style={{ fontSize: 34, lineHeight: 34, fontFamily: theme.font.bold, letterSpacing: -1.36, color: '#1E0D2A' }}>
                {diverted === null ? '–' : Math.round(diverted * 100)}%
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 14, letterSpacing: 1.12, color: '#1E0D2A' }}>Diverted</Text>
            </View>
            {/* The diverted share in green, the rest in red. */}
            <View style={{ position: 'absolute', left: 29, right: 29, top: 92, flexDirection: 'row', justifyContent: 'space-between' }}>
              {Array.from({ length: STICKS }, (_, i) => (
                <View key={i} style={{ width: 8, height: 16, borderRadius: 13, backgroundColor: i < greenSticks ? '#0A5A14' : '#B72735' }} />
              ))}
            </View>
            <Text style={{ position: 'absolute', left: 29, top: 127, fontSize: 13, lineHeight: 13, color: '#707070' }}>
              {stats.used} diverted . {stats.wasted} landfilled
            </Text>
          </View>
        ) : null}

        {!loading && expiring.length > 0 ? (
          // "Make a recipe →": a 132×36 lime pill hanging off the stats card's foot.
          <View style={hasStats ? { zIndex: 10, marginTop: -17, paddingLeft: 177 } : { marginBottom: 16, alignItems: 'flex-end' }}>
            <Pressable
              testID="grocery-make-recipe"
              onPress={makeRecipe}
              style={{ height: 36, width: 132, borderRadius: 999, backgroundColor: '#D3FD5D', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 14, color: '#010B02' }}>Make a recipe →</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? null : scans.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>No scans yet</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
              Scan your shopping and it&apos;ll all be kept here.
            </Text>
            <Pressable
              testID="grocery-first-scan"
              onPress={newScan}
              style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#D1FF52', paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>Scan my groceries</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Two views of the same food: what's still to use, and every shop so far. */}
            <View accessibilityRole="tablist" style={{ marginTop: 16, flexDirection: 'row', borderRadius: 999, backgroundColor: '#F1F3EF', padding: 4 }}>
              {(
                [
                  ['expiring', 'Expiring', expiring.length],
                  ['history', 'History', null],
                ] as const
              ).map(([key, label, count]) => {
                const on = view === key;
                return (
                  <Pressable
                    key={key}
                    testID={`grocery-tab-${key}`}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    onPress={() => setView(key)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderRadius: 999,
                      paddingVertical: 8,
                      backgroundColor: on ? '#ffffff' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: on ? '#010B02' : '#5D6659' }}>
                      {label}
                    </Text>
                    {count !== null ? (
                      <View style={{ borderRadius: 999, paddingHorizontal: 6, backgroundColor: on ? '#DCFE77' : 'rgba(0,0,0,0.05)' }}>
                        <Text style={{ fontSize: 11, fontFamily: theme.font.semibold, color: on ? '#1E0D2A' : '#5D6659' }}>
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ marginTop: 16, paddingHorizontal: 8, fontSize: 12, color: '#8A8F87' }}>
              Tap a card for details
            </Text>

            <View style={{ marginTop: 8, paddingHorizontal: 2 }}>
              {view === 'expiring' ? (
                expiring.length > 0 ? (
                  <View style={{ gap: 12 }}>{expiring.map(renderRow)}</View>
                ) : (
                  <Text style={{ paddingVertical: 40, textAlign: 'center', fontSize: 14, color: '#64748B' }}>
                    Nothing left in your list. Everything&apos;s been used or cleared.
                  </Text>
                )
              ) : (
                <View style={{ gap: 28 }}>
                  {scans.map((scan) => (
                    <View key={scan.cartId}>
                      {/* The shop itself: small photo, when, and how much was in it. */}
                      <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {scan.imageUrl ? (
                          <Image source={{ uri: scan.imageUrl }} style={{ width: 64, height: 64, borderRadius: 16 }} />
                        ) : (
                          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 10, color: '#94A3B8' }}>No photo</Text>
                          </View>
                        )}
                        <View>
                          <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#1A1A2E' }}>{scanDate(scan.scannedAt)}</Text>
                          <Text style={{ fontSize: 12, color: '#64748B' }}>{scanCount(scan)}</Text>
                        </View>
                      </View>
                      <View style={{ gap: 12 }}>{scan.items.map(renderRow)}</View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <GroceryDivaBar
        items={expiring}
        onAsk={(question) => {
          openChatSection('grocery');
          askDivaWith(question);
          navigation.navigate('/ai');
        }}
      />

      {undo ? (
        <UndoBar
          bottom={31 + 68 + 12 + insets.bottom}
          message={`${undo.count > 1 ? `${undo.count} × ` : ''}${undo.item.name} marked ${
            undo.status === 'consumed' ? 'used' : 'thrown away'
          }`}
          onUndo={() => void undoSettle()}
          onDismiss={() => setUndo(null)}
          // Used it up? Its packaging still has somewhere to go.
          action={
            undo.status === 'consumed'
              ? {
                  label: undo.item.packaging?.primaryType
                    ? undo.item.packaging.primaryType === 'organic'
                      ? 'Find compost drop-off'
                      : `Find ${undo.item.packaging.primaryType} drop-off`
                    : 'Find a drop-off',
                  onPress: () => navigation.navigate(recycleHref(undo.item.packaging)),
                }
              : undefined
          }
        />
      ) : null}

      {acting ? (
        <ItemActionsSheet
          item={acting}
          onClose={() => setActing(null)}
          onChangeDate={() => {
            setPicking(acting);
            setActing(null);
          }}
          onRename={(name) => void rename(acting, name)}
          onUsed={() => {
            setActing(null);
            startSettle(acting, 'consumed');
          }}
          onThrown={() => {
            setActing(null);
            startSettle(acting, 'discarded');
          }}
        />
      ) : null}

      {counting ? (
        <SettleCountSheet
          itemName={counting.item.name}
          quantity={counting.item.quantity ?? 1}
          status={counting.status}
          onCancel={() => setCounting(null)}
          onConfirm={(count) => {
            const { item, status } = counting;
            setCounting(null);
            void settle(item, status, count);
          }}
        />
      ) : null}

      {picking ? (
        <ExpiryDatePicker
          itemName={picking.name}
          value={picking.expiresOn}
          saving={busyId === picking._id}
          onCancel={() => setPicking(null)}
          onSave={(date) => void saveDate(date)}
        />
      ) : null}
    </View>
  );
}

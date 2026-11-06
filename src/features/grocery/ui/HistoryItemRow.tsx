import { useMemo, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import {
  URGENCY_STYLES,
  listExpiryLine,
  urgencyOf,
  type GroceryItem,
} from '@/core/grocery';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { CheckGlyph } from '@/shared/ui/icons/featherGlyphs';
import { TrashGlyph } from '@/shared/ui/icons/groceryGlyphs';

import { ReminderThumb } from './ReminderThumb';
import { DELETE_AT, USED_AT, createSwipeResponder } from './swipe-responder';

const SETTLED_LABEL: Record<string, string> = {
  consumed: 'Used',
  discarded: 'Thrown away',
  expired: 'Expired unused',
};

/**
 * One item in the grocery list (web HistoryItemRow.tsx): the name (and how many), when
 * it goes, what it comes in, "How to divert?" and the reminder switch, on a card tinted
 * by how soon it goes. Swipe right if used, left if thrown away; tap for everything else.
 */
export function HistoryItemRow({
  item,
  busy,
  showTag = false,
  onToggleReminder,
  onOpen,
  onDivert,
  onUsed,
  onDelete,
}: {
  item: GroceryItem;
  busy?: boolean;
  /** The photo's number: only where the photo is on screen too. */
  showTag?: boolean;
  onToggleReminder: () => void;
  onOpen: () => void;
  onDivert: () => void;
  onUsed: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const { haptics } = usePorts();
  const [width, setWidth] = useState(320);
  const [dragX, setDragX] = useState(0);
  const [x] = useState(() => new Animated.Value(0));

  const urgency = urgencyOf(item.expiresOn, item.status);
  const styles = URGENCY_STYLES[urgency];
  const quantity = item.quantity ?? 1;
  const remindersOn = item.remindersEnabled !== false;
  const gone = !!item.status && item.status !== 'active';
  const expiry = listExpiryLine(item.expiresOn, item.expirySource);

  const pan = useMemo(
    () =>
      createSwipeResponder({
        x,
        width,
        enabled: !gone && !busy,
        onDrag: setDragX,
        onArm: () => haptics.light(),
        onCommit: (commit) => (commit === 'used' ? onUsed : onDelete)(),
      }),
    [x, width, gone, busy, haptics, onUsed, onDelete],
  );

  const usedProgress = Math.min(1, Math.max(0, dragX / (width * USED_AT)));
  const deleteProgress = Math.min(1, Math.max(0, -dragX / (width * DELETE_AT)));
  const behind = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 };

  return (
    <View
      testID={`grocery-row-${item._id}`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width || 320)}
      style={{ borderRadius: 22, overflow: 'hidden' }}
    >
      {/* Behind the row: what letting go now would do. */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 22,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: dragX > 0 ? '#1B7A3D' : dragX < 0 ? '#A31621' : 'transparent',
        }}
      >
        <View style={{ ...behind, opacity: dragX > 0 ? 0.55 + usedProgress * 0.45 : 0 }}>
          <CheckGlyph color="#ffffff" size={16} />
          <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#ffffff' }}>
            {usedProgress >= 1 ? 'Used it' : 'Keep pulling'}
          </Text>
        </View>
        <View style={{ ...behind, opacity: dragX < 0 ? 0.55 + deleteProgress * 0.45 : 0 }}>
          <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#ffffff' }}>
            {deleteProgress >= 1 ? 'Throwing away' : 'Keep pulling'}
          </Text>
          <TrashGlyph color="#ffffff" size={16} />
        </View>
      </View>

      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}: more options`}
          disabled={gone || busy}
          onPress={onOpen}
          style={{
            minHeight: 92,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: '#E6E6E6',
            paddingVertical: 14,
            paddingLeft: 16,
            paddingRight: 14,
            backgroundColor: styles.card,
            opacity: gone ? 0.6 : 1,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              {showTag ? (
                <View
                  style={{
                    marginTop: 1,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 4,
                    borderRadius: 10,
                    backgroundColor: '#DCFE77',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
                    {item.tag}
                  </Text>
                </View>
              ) : null}
              <Text
                numberOfLines={2}
                style={{
                  flexShrink: 1,
                  fontSize: 15,
                  lineHeight: 19,
                  fontFamily: theme.font.semibold,
                  color: styles.text,
                }}
              >
                {item.name}
                {quantity > 1 ? (
                  <Text style={{ fontFamily: theme.font.regular, color: styles.quiet }}>
                    {' '}×{quantity}
                  </Text>
                ) : null}
              </Text>
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: styles.text }}>
                {gone
                  ? (SETTLED_LABEL[item.status] ?? 'Done')
                  : expiry.charAt(0).toUpperCase() + expiry.slice(1)}
              </Text>
              {item.packaging?.label ? (
                <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 13, color: styles.quiet }}>
                  · {item.packaging.label}
                </Text>
              ) : null}
            </View>
            <Pressable testID={`grocery-divert-${item._id}`} onPress={onDivert} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: styles.link }}>
                How to divert?
              </Text>
            </Pressable>
          </View>
          {!gone ? (
            <ReminderThumb
              on={remindersOn}
              urgency={urgency}
              onToggle={onToggleReminder}
              disabled={busy}
            />
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { expiryLine, parseExpiryInput, type GroceryItem } from '@/core/grocery';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { DatePickerField } from '@/shared/ui/DatePickerField';
import {
  CalendarGlyph,
  CheckGlyph,
  EditGlyph,
  MinusGlyph,
  PlusGlyph,
  UndoGlyph,
  XGlyph,
} from '@/shared/ui/icons/featherGlyphs';
import { TrashGlyph } from '@/shared/ui/icons/groceryGlyphs';

export type SettleStatus = 'consumed' | 'discarded';

function Action({
  icon,
  label,
  hint,
  danger,
  onPress,
  testID,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
  testID: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? 'rgba(220,53,69,0.1)' : '#F1F5EC',
        }}
      >
        {icon}
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: danger ? '#B72735' : '#010B02' }}>
          {label}
        </Text>
        {hint ? <Text style={{ fontSize: 12, color: '#707070' }}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

/**
 * Everything you can do to an item, one tap from its card (web ItemActionsSheet.tsx):
 * change the date, rename in place, used it, delete. The card itself keeps only its
 * name, date and "How to divert?".
 */
export function ItemActionsSheet({
  item,
  onClose,
  onChangeDate,
  onRename,
  onUsed,
  onThrown,
}: {
  item: GroceryItem;
  onClose: () => void;
  onChangeDate: () => void;
  onRename: (name: string) => void;
  onUsed: () => void;
  onThrown: () => void;
}) {
  const theme = useTheme();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.name);
  const quantity = item.quantity ?? 1;

  const saveName = () => {
    const next = name.trim();
    if (next && next !== item.name) onRename(next);
    onClose();
  };

  return (
    <BottomSheet open onClose={onClose} testID="grocery-actions">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: theme.font.semibold, color: '#010B02' }}>
            {item.name}
            {quantity > 1 ? (
              <Text style={{ fontFamily: theme.font.regular, color: '#707070' }}> · {quantity}</Text>
            ) : null}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 13, color: '#707070' }}>
            {expiryLine(item.expiresOn, item.expirySource)}
          </Text>
        </View>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ padding: 6 }}>
          <XGlyph color="#94A3B8" size={20} />
        </Pressable>
      </View>

      {renaming ? (
        <View style={{ marginTop: 16, paddingHorizontal: 12 }}>
          <TextInput
            testID="grocery-rename-input"
            autoFocus
            value={name}
            onChangeText={setName}
            maxLength={120}
            accessibilityLabel="Item name"
            onSubmitEditing={saveName}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.1)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: '#010B02',
            }}
          />
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setRenaming(false)}
              style={{ flex: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#334155' }}>Back</Text>
            </Pressable>
            <Pressable
              testID="grocery-rename-save"
              onPress={saveName}
              style={{ flex: 1, borderRadius: 999, backgroundColor: '#D3FD5D', paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#010B02' }}>Save name</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 12, gap: 2 }}>
          <Action
            testID="grocery-action-date"
            icon={<CalendarGlyph color="#0A5A14" size={18} />}
            label="Change expiry date"
            onPress={onChangeDate}
          />
          <Action
            testID="grocery-action-rename"
            icon={<EditGlyph color="#0A5A14" size={17} />}
            label="Rename"
            onPress={() => setRenaming(true)}
          />
          <Action
            testID="grocery-action-used"
            icon={<CheckGlyph color="#0A5A14" size={18} />}
            label="Used it"
            hint="Swipe right on the card to do this faster"
            onPress={onUsed}
          />
          <Action
            testID="grocery-action-delete"
            icon={<TrashGlyph color="#B72735" size={17} />}
            label="Delete item"
            hint="Thrown away · or swipe left"
            danger
            onPress={onThrown}
          />
        </View>
      )}
    </BottomSheet>
  );
}

/**
 * "How many?": a swipe on a row that stands for several of the same thing (3 limes)
 * asks how many, so the rest stay in the list (web SettleCountSheet.tsx).
 */
export function SettleCountSheet({
  itemName,
  quantity,
  status,
  onCancel,
  onConfirm,
}: {
  itemName: string;
  quantity: number;
  status: SettleStatus;
  onCancel: () => void;
  onConfirm: (count: number) => void;
}) {
  const theme = useTheme();
  const [count, setCount] = useState(1);
  const verb = status === 'consumed' ? 'Used' : 'Threw away';
  const step = (by: number) => setCount((n) => Math.min(quantity, Math.max(1, n + by)));
  const round = { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <BottomSheet open onClose={onCancel} testID="grocery-count">
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#010B02' }}>
          How many {itemName} {status === 'consumed' ? 'did you use' : 'did you throw away'}?
        </Text>
        <Text style={{ marginTop: 2, fontSize: 13, color: '#707070' }}>
          You have {quantity}. The rest stay in your list.
        </Text>
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Pressable accessibilityLabel="One fewer" disabled={count <= 1} onPress={() => step(-1)} style={{ ...round, opacity: count <= 1 ? 0.3 : 1 }}>
            <MinusGlyph color="#010B02" size={20} />
          </Pressable>
          <Text testID="grocery-count-value" style={{ width: 48, textAlign: 'center', fontSize: 34, fontFamily: theme.font.semibold, color: '#1E0D2A' }}>
            {count}
          </Text>
          <Pressable accessibilityLabel="One more" disabled={count >= quantity} onPress={() => step(1)} style={{ ...round, opacity: count >= quantity ? 0.3 : 1 }}>
            <PlusGlyph color="#010B02" size={20} />
          </Pressable>
        </View>
        <View style={{ marginTop: 20, flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => onConfirm(quantity)}
            style={{ flex: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#334155' }}>All {quantity}</Text>
          </Pressable>
          <Pressable
            testID="grocery-count-confirm"
            onPress={() => onConfirm(count)}
            style={{
              flex: 1,
              borderRadius: 999,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: status === 'consumed' ? '#D3FD5D' : '#DC3545',
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: status === 'consumed' ? '#010B02' : '#FAFFEF' }}>
              {verb} {count === quantity ? 'all' : count}
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={onCancel} style={{ marginTop: 8, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#64748B' }}>Cancel</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const inDays = (days: number, from = new Date()) => isoDate(new Date(from.getTime() + days * DAY_MS));

const QUICK = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In a week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'In a month', days: 30 },
];

const readable = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Picking an expiry date (web ExpiryDatePicker.tsx): common choices in one tap, the
 * phone's own date picker for anything else, and typing it in plain words.
 */
export function ExpiryDatePicker({
  itemName,
  value,
  saving,
  onCancel,
  onSave,
}: {
  itemName: string;
  value?: string | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (date: string) => void;
}) {
  const theme = useTheme();
  const [date, setDate] = useState(value?.slice(0, 10) || inDays(3));
  const [spoken, setSpoken] = useState('');
  // A year back at most, fixed when the sheet opens.
  const [earliest] = useState(() => new Date(Date.now() - 365 * DAY_MS));
  const label = { fontSize: 12, fontFamily: theme.font.semibold, color: '#64748B', letterSpacing: 0.3, textTransform: 'uppercase' as const };

  return (
    <BottomSheet open onClose={onCancel} testID="grocery-date">
      <View style={{ paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View>
            <Text style={{ fontSize: 16, fontFamily: theme.font.bold, color: '#1A1A2E' }}>Expiry date</Text>
            <Text style={{ fontSize: 13, color: '#64748B' }}>{itemName}</Text>
          </View>
          <Pressable accessibilityLabel="Close" onPress={onCancel} style={{ padding: 6 }}>
            <XGlyph color="#94A3B8" size={20} />
          </Pressable>
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK.map((quick) => {
            const quickDate = inDays(quick.days);
            const active = quickDate === date;
            return (
              <Pressable
                key={quick.label}
                onPress={() => setDate(quickDate)}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? '#D1FF52' : 'rgba(0,0,0,0.1)',
                  backgroundColor: active ? '#EAFFB0' : '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: active ? '#14361B' : '#334155' }}>
                  {quick.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ ...label, marginTop: 16 }}>Pick a date</Text>
        <DatePickerField
          testID="grocery-date-field"
          value={date}
          minimumDate={earliest}
          onChange={setDate}
        />
        <Text style={{ ...label, marginTop: 12 }}>Or say it in words</Text>
        <TextInput
          testID="grocery-date-words"
          value={spoken}
          onChangeText={(text) => {
            setSpoken(text);
            const parsed = parseExpiryInput(text);
            if (parsed) setDate(parsed);
          }}
          placeholder="third of September, 21/10/2026, in 5 days"
          placeholderTextColor="#94A3B8"
          style={{
            marginTop: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
            color: '#1E293B',
          }}
        />
        <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#475569' }}>{readable(date)}</Text>
        <Pressable
          testID="grocery-date-save"
          disabled={saving}
          onPress={() => onSave(date)}
          style={{ marginTop: 12, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
        >
          <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#14361B' }}>
            {saving ? 'Saving…' : 'Save expiry date'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/** How long Undo stays offered; a little longer with a second thing to read and tap. */
const WINDOW_MS = 6000;
const WINDOW_WITH_ACTION_MS = 9000;

/**
 * What a swipe did, and the way back (web UndoBar.tsx): the action happens at once and
 * this is the escape hatch, with the time left shown along its foot. After "used" it
 * also offers where the packaging goes.
 */
export function UndoBar({
  message,
  onUndo,
  onDismiss,
  action,
  bottom,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  action?: { label: string; onPress: () => void };
  /** Distance from the screen's foot (above the DiVA bar). */
  bottom: number;
}) {
  const theme = useTheme();
  const [left, setLeft] = useState(1);
  // A parent re-render mustn't restart the countdown: the latest dismiss is kept here.
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);
  const windowMs = action ? WINDOW_WITH_ACTION_MS : WINDOW_MS;

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const remaining = 1 - (Date.now() - started) / windowMs;
      if (remaining <= 0) {
        clearInterval(tick);
        dismiss.current();
      } else {
        setLeft(remaining);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [message, windowMs]);

  return (
    <View
      testID="grocery-undo"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom,
        zIndex: 30,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontFamily: theme.font.medium, color: '#ffffff' }}>
          {message}
        </Text>
        <Pressable
          testID="grocery-undo-button"
          onPress={onUndo}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: '#D1FF52', paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <UndoGlyph color="#14361B" size={14} />
          <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#14361B' }}>Undo</Text>
        </Pressable>
      </View>
      {action ? (
        <Pressable
          onPress={() => {
            dismiss.current();
            action.onPress();
          }}
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#D1FF52' }}>{action.label} →</Text>
        </Pressable>
      ) : null}
      {/* The time left, so it doesn't vanish without warning. */}
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
        <View style={{ height: 3, width: `${left * 100}%`, backgroundColor: '#D1FF52' }} />
      </View>
    </View>
  );
}

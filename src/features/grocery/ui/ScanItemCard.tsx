import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { expiryLine, urgencyOf, type ExpirySource } from '@/core/grocery';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { XGlyph } from '@/shared/ui/icons/featherGlyphs';

import { ReminderThumb } from './ReminderThumb';

/**
 * One item under the scan's photo (web GroceryItemCard, compact): its number, a name
 * that renames in place, the date with "Add/Change expiry date", Separate on a combined
 * row, the reminder switch, and an × to drop a wrong detection.
 */
export function ScanItemCard({
  tag,
  extraTags,
  name,
  expiresOn,
  expirySource,
  remindersEnabled,
  onToggleReminder,
  onRename,
  onAddDate,
  onRemove,
  onSplit,
}: {
  tag: number;
  extraTags?: number[];
  name: string;
  expiresOn?: string | null;
  expirySource?: ExpirySource | null;
  remindersEnabled: boolean;
  onToggleReminder: () => void;
  onRename: (name: string) => void;
  onAddDate: () => void;
  onRemove: () => void;
  onSplit?: () => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const finish = (save: boolean) => {
    const next = draft?.trim();
    setDraft(null);
    if (save && next && next !== name) onRename(next);
  };

  return (
    <View
      testID={`scan-item-${tag}`}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <View style={{ marginTop: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#D1FF52', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, fontFamily: theme.font.bold, color: '#14361B' }}>{tag}</Text>
      </View>
      {extraTags && extraTags.length > 0 ? (
        <Text style={{ marginTop: 4, marginLeft: -6, fontSize: 11, fontFamily: theme.font.semibold, color: '#64748B' }}>
          +{extraTags.join(', ')}
        </Text>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {draft === null ? (
          <Pressable accessibilityLabel={`Rename ${name}`} onPress={() => setDraft(name)}>
            <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 18, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
              {name}
            </Text>
          </Pressable>
        ) : (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onBlur={() => finish(true)}
            onSubmitEditing={() => finish(true)}
            maxLength={120}
            accessibilityLabel="Item name"
            style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#1A1A2E', borderWidth: 1, borderColor: '#1B7A3D', borderRadius: 6, paddingHorizontal: 4 }}
          />
        )}
        <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 16, color: '#475569' }}>
          {expiryLine(expiresOn, expirySource)}
        </Text>
        <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Pressable testID={`scan-item-date-${tag}`} onPress={onAddDate}>
            <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#1B7A3D' }}>
              {expiresOn ? 'Change expiry date' : 'Add expiry date'}
            </Text>
          </Pressable>
          {onSplit ? (
            <Pressable onPress={onSplit}>
              <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#64748B' }}>Separate</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ReminderThumb
        on={remindersEnabled}
        urgency={urgencyOf(expiresOn, 'active')}
        onToggle={onToggleReminder}
        size="compact"
      />
      <Pressable
        testID={`scan-item-remove-${tag}`}
        accessibilityLabel={`Remove ${name}`}
        onPress={onRemove}
        style={{
          position: 'absolute',
          right: -6,
          top: -6,
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          backgroundColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <XGlyph color="#94A3B8" size={14} />
      </Pressable>
    </View>
  );
}

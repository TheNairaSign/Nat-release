import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Input, Text } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/BottomSheet';

import { suggestEdit, type PlaceTargetType } from '../api/saved-api';

/**
 * Web's SuggestEditButton: a quiet link under a WHERE card that opens a short form —
 * closed down, wrong address, wrong hours — for an admin to review. A guest is asked to
 * sign in first.
 */
export function SuggestEditLink({
  targetType,
  targetId,
  targetName,
  guest,
  onRequireSignIn,
}: {
  targetType: PlaceTargetType;
  targetId: string;
  targetName?: string;
  guest?: boolean;
  onRequireSignIn?: () => void;
}) {
  const theme = useTheme();
  const { http } = usePorts();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const close = () => {
    setOpen(false);
    setMessage('');
    setSent(false);
    setFailed(false);
  };

  async function send() {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setFailed(false);
    try {
      await suggestEdit(http, { targetType, targetId, targetName, message: text });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Pressable
        testID="where-suggest-edit"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => (guest ? onRequireSignIn?.() : setOpen(true))}
        style={{ alignSelf: 'center', paddingVertical: 4 }}
      >
        <Text style={{ fontSize: 12, fontFamily: theme.font.medium, color: '#94a3b8', textDecorationLine: 'underline' }}>
          Suggest an edit
        </Text>
      </Pressable>

      <BottomSheet open={open} onClose={close} testID="where-suggest-edit-sheet">
        {sent ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: theme.font.bold, color: '#111827' }}>
              Thanks for the heads up
            </Text>
            <Text style={{ marginTop: 6, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
              An admin will take a look{targetName ? ` at ${targetName}` : ''}.
            </Text>
            <Pressable
              testID="where-suggest-edit-done"
              onPress={close}
              style={{ marginTop: 20, alignSelf: 'stretch', borderRadius: 999, backgroundColor: '#204C27', paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#ffffff' }}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 18, fontFamily: theme.font.bold, color: '#111827' }}>
              What&apos;s wrong{targetName ? ` with ${targetName}` : ''}?
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
              Closed down, wrong address, wrong hours — whatever you noticed.
            </Text>
            <Input
              testID="where-suggest-edit-input"
              label="Tell us what to fix…"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              style={{ marginTop: 14, minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }}
            />
            {failed ? (
              <Text style={{ marginTop: 8, fontSize: 12, color: '#e11d48' }}>
                Couldn&apos;t send that. Try again.
              </Text>
            ) : null}
            <Pressable
              testID="where-suggest-edit-send"
              disabled={!message.trim() || sending}
              onPress={() => void send()}
              style={{
                marginTop: 14,
                borderRadius: 999,
                backgroundColor: '#204C27',
                paddingVertical: 12,
                alignItems: 'center',
                opacity: !message.trim() || sending ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#ffffff' }}>
                {sending ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { CheckGlyph } from '@/shared/ui/icons/featherGlyphs';

import {
  fetchAttendance,
  setAttending,
  type CampaignAttendance,
} from '../api/where-api';

/**
 * "I'll attend" on an event's card, with how many are going. It answers at once and
 * puts it back if the save fails. A guest is asked to sign in. Web
 * CampaignDetailsCard.tsx (Oct 27).
 */
export function AttendButton({
  campaignId,
  guest,
  onRequireSignIn,
}: {
  campaignId: string;
  guest: boolean;
  onRequireSignIn?: () => void;
}) {
  const theme = useTheme();
  const { http } = usePorts();
  const [attendance, setAttendance] = useState<CampaignAttendance | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (guest) return;
    let cancelled = false;
    fetchAttendance(http, campaignId)
      .then((a) => !cancelled && setAttendance(a))
      .catch(() => undefined); // no count is fine; the button still works
    return () => {
      cancelled = true;
    };
  }, [http, campaignId, guest]);

  async function toggle() {
    if (guest) {
      onRequireSignIn?.();
      return;
    }
    const going = !attendance?.attending;
    const before = attendance;
    setFailed(false);
    setAttendance({
      count: Math.max(0, (attendance?.count ?? 0) + (going ? 1 : -1)),
      attending: going,
    });
    setSaving(true);
    try {
      setAttendance(await setAttending(http, campaignId, going));
    } catch {
      setAttendance(before);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const going = Boolean(attendance?.attending);
  return (
    <View style={{ paddingTop: 4 }}>
      {/* web: rounded-full py-2.5 text-sm bold; lime until they're going, then
          white with an emerald border and a check */}
      <Pressable
        testID="where-attend"
        accessibilityState={{ selected: going }}
        disabled={saving}
        onPress={() => void toggle()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 999,
          paddingVertical: 10,
          opacity: saving ? 0.6 : 1,
          backgroundColor: going ? '#ffffff' : '#D1FF52',
          borderWidth: going ? 1 : 0,
          borderColor: 'rgba(4,120,87,0.3)',
        }}
      >
        {going ? <CheckGlyph color="#065F46" size={12} strokeWidth={3} /> : null}
        <Text
          style={{
            fontSize: 14,
            fontFamily: theme.font.bold,
            color: going ? '#065F46' : '#14361B',
          }}
        >
          {going ? "You're going" : "I'll attend"}
        </Text>
      </Pressable>
      {attendance && attendance.count > 0 ? (
        <Text style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
          {attendance.attending && attendance.count === 1
            ? "You're the first to say you're going"
            : `${attendance.count} ${attendance.count === 1 ? 'person' : 'people'} going`}
        </Text>
      ) : null}
      {failed ? (
        <Text style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#e11d48' }}>
          Couldn&apos;t save that. Try again.
        </Text>
      ) : null}
    </View>
  );
}

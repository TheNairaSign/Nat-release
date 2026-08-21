import { Platform, Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';

import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { CloseGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

const DISMISS_KEY = 'safariWarningDismissed';

function isIphoneSafariWeb(): boolean {
  if (Platform.OS !== 'web') return false;
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const isIPhone = /iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIPhone && isSafari;
}

export function SafariBanner() {
  const theme = useTheme();
  const { kv } = usePorts();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!isIphoneSafariWeb()) return;
      const dismissed = await kv.get<string>(DISMISS_KEY);
      if (!cancelled && !dismissed) setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [kv]);

  if (!visible) return null;

  return (
    <View
      style={{
        backgroundColor: theme.color.safariBg,
        borderLeftWidth: 4,
        borderLeftColor: theme.color.safariBorder,
        padding: theme.space[4],
        marginBottom: theme.space[4],
        borderRadius: theme.radius.sm,
        ...theme.shadow.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          variant="small"
          style={{
            fontFamily: theme.font.semibold,
            color: theme.color.safariTitle,
            marginBottom: 4,
          }}
        >
          For the best experience
        </Text>
        <Text
          variant="caption"
          style={{ fontSize: 12, color: theme.color.safariBody }}
        >
          {"This app works better on Chrome due to Safari's gesture conflicts."}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={() => {
          setVisible(false);
          void kv.set(DISMISS_KEY, 'true');
        }}
        style={{ marginLeft: theme.space[3], padding: 4 }}
      >
        <CloseGlyph color={theme.color.safariDismiss} size={16} />
      </Pressable>
    </View>
  );
}

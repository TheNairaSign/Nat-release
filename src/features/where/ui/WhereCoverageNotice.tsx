import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

/** Once a visit, as web keeps it in sessionStorage: a module flag lasts the app's run. */
let seenThisVisit = false;

/**
 * For someone outside the mapped states: the map still opens, but they hear why it
 * looks empty. Web components/WhereCoverageNotice.tsx; its "Open Grocery Manager"
 * button joins this once the Grocery Manager is in the app.
 */
export function WhereCoverageNotice() {
  const theme = useTheme();
  const [open, setOpen] = useState(() => !seenThisVisit);
  if (!open) return null;

  const dismiss = () => {
    seenThisVisit = true;
    setOpen(false);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
          paddingHorizontal: 24,
        }}
      >
        <View
          testID="where-coverage-notice"
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 384,
            borderRadius: 28,
            backgroundColor: '#ffffff',
            padding: 24,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 20,
              lineHeight: 26,
              fontFamily: theme.font.bold,
              color: '#010B02',
              textAlign: 'center',
            }}
          >
            The Where section hasn&apos;t covered your state yet
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 20,
              color: '#475569',
              textAlign: 'center',
            }}
          >
            We&apos;re adding new areas. You can still explore the map, and DiVA works
            wherever you are.
          </Text>
          <Pressable
            testID="where-coverage-explore"
            onPress={dismiss}
            style={{
              marginTop: 20,
              height: 46,
              width: '100%',
              borderRadius: 999,
              backgroundColor: '#1C0F28',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: theme.font.medium, color: '#FAFFEF' }}>
              Explore the map
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

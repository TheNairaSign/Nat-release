import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

/** Once a visit, as web keeps it in sessionStorage: a module flag lasts the app's run. */
let seenThisVisit = false;

/**
 * For someone outside the mapped states: the map still opens, but they hear why it
 * looks empty and what they can use where they are. Web WhereCoverageNotice.tsx.
 */
export function WhereCoverageNotice({ onGroceryManager }: { onGroceryManager: () => void }) {
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
            We&apos;re adding new areas. You can still explore the map, and Grocery Manager,
            SnapDivert and DiVA work wherever you are.
          </Text>
          <Pressable
            testID="where-coverage-grocery"
            onPress={() => {
              dismiss();
              onGroceryManager();
            }}
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
              Open Grocery Manager
            </Text>
          </Pressable>
          <Pressable
            testID="where-coverage-explore"
            onPress={dismiss}
            style={{ marginTop: 8, height: 46, width: '100%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 15, fontFamily: theme.font.medium, color: '#1C0F28' }}>
              Explore the map
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

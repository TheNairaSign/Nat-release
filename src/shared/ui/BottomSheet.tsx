import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A sheet from the bottom over a dim backdrop, as web's grocery sheets are drawn
 * (`rounded-t-[28px] bg-white px-4 pt-3`, a grab handle, `bg-black/25` behind). Tapping
 * outside closes it.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  testID,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <Pressable
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <View
            testID={testID}
            accessibilityViewIsModal
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16 + insets.bottom,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                marginBottom: 12,
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E2E8F0',
              }}
            />
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

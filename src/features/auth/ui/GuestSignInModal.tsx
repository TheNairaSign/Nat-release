import { Modal, Pressable, View } from 'react-native';

import { LimeButton } from './legacy-auth';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { BrandLogo } from '@/shared/ui/BrandMark';
import { CloseGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

export function GuestSignInModal({
  open,
  onClose,
  message = 'Sign in to record your drop-off and earn Carbon Units.',
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  const theme = useTheme();
  const { navigation } = usePorts();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        testID="guest-modal-backdrop"
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: theme.glass.overlay,
        }}
      >
        <View
          testID="guest-signin-modal"
          style={{
            width: '100%',
            maxWidth: theme.layout.appColumnMaxWidth,
            backgroundColor: theme.color.surface,
            borderTopLeftRadius: theme.radius.card24,
            borderTopRightRadius: theme.radius.card24,
            paddingHorizontal: theme.space[5],
            paddingTop: theme.space[6],
            paddingBottom: 40,
            ...theme.shadow.md,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.inputBorder,
              marginBottom: theme.space[4],
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{
              position: 'absolute',
              top: theme.space[4],
              right: theme.space[4],
              padding: 8,
            }}
          >
            <CloseGlyph color={theme.color.placeholder} />
          </Pressable>
          <BrandLogo
            height={40}
            style={{ alignSelf: 'center', marginBottom: theme.space[4] }}
          />
          <Text
            variant="heading"
            style={{
              textAlign: 'center',
              fontSize: 20,
              marginBottom: theme.space[2],
            }}
          >
            Join NatCycle
          </Text>
          <Text
            variant="small"
            muted
            style={{
              textAlign: 'center',
              marginBottom: theme.space[5],
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
          <LimeButton
            testID="guest-modal-sign-in"
            label="Sign In"
            onPress={() => {
              onClose();
              navigation.navigate('/sign-in?redirect=/where');
            }}
          />
          <Text
            muted
            variant="small"
            style={{ textAlign: 'center', marginTop: theme.space[4] }}
          >
            New here?{' '}
            <Text
              variant="small"
              accessibilityRole="link"
              onPress={() => {
                onClose();
                navigation.navigate('/sign-up');
              }}
              style={{
                color: theme.color.accent,
                fontFamily: theme.font.semibold,
              }}
            >
              Create an account
            </Text>
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

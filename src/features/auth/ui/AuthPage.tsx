import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';

import { useTheme } from '@/shared/theme';
import { Screen } from '@/shared/ui/Screen';

export function AuthPage({
  children,
  topRatio,
}: {
  children: ReactNode;
  topRatio?: number;
}) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const offset = height * (topRatio ?? theme.layout.signInTopRatio);

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.layout.pagePadX,
            paddingBottom: theme.space[5],
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: theme.layout.authColumnMaxWidth,
              alignSelf: 'center',
              paddingTop: offset,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

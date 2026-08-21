import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '@/shared/theme';
import { BrandLogo, Screen, Text } from '@/shared/ui';

export function LegacyAuthPage({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <BrandLogo
            width={theme.layout.forgotLogoWidth}
            style={{
              alignSelf: 'center',
              marginTop: theme.layout.legacyLogoTop,
              marginBottom: theme.space[5],
            }}
          />
          <View
            style={{
              backgroundColor: theme.color.band,
              minHeight: theme.layout.legacyBandMinHeight,
              paddingHorizontal: theme.layout.pagePadX,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: theme.layout.legacyCardMaxWidth,
                alignSelf: 'center',
                marginVertical: theme.space[7],
              }}
            >
              <View
                style={{
                  borderWidth: 2,
                  borderColor: theme.color.legacyBorder,
                  borderRadius: theme.radius.sm,
                  padding: theme.space[4],
                  backgroundColor: theme.color.surface,
                  marginVertical: 40,
                }}
              >
                {children}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function LegacyTextField({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.color.placeholder}
      style={[
        {
          width: '100%',
          paddingHorizontal: theme.space[3],
          paddingVertical: theme.space[3],
          marginTop: theme.space[1],
          marginBottom: theme.space[4],
          fontSize: theme.type.small,
          fontFamily: theme.font.regular,
          color: theme.color.label,
          backgroundColor: theme.color.surface,
          borderWidth: 1,
          borderColor: theme.color.inputBorder,
          borderRadius: theme.radius.lg,
          ...theme.shadow.sm,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function LimeButton({
  label,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.space[4],
        paddingHorizontal: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.limeButton,
        borderWidth: 1,
        borderColor: theme.color.legacyBorder,
        opacity: disabled ? 0.5 : 1,
        ...theme.shadow.sm,
      }}
    >
      <Text
        style={{
          color: theme.color.onLime,
          fontFamily: theme.font.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LegacyBackLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ alignSelf: 'flex-start', paddingVertical: theme.space[2] }}
    >
      <Text
        style={{ color: theme.color.accent, textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

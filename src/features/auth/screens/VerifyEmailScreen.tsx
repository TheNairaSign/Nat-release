import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { requestOtp, verifyEmail } from '../api/auth-api';
import { validateOtp } from '../model/signup-validation';
import { AuthErrorBanner } from '../ui';
import { readHttpErrorMessage } from '@/shared/api/errors';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { BrandIllustration, BrandLogo, Screen, Text } from '@/shared/ui';

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function onVerify() {
    const otpError = validateOtp(otp);
    if (otpError) {
      setError(otpError);
      return;
    }
    setPending(true);
    setError('');
    try {
      await verifyEmail(http, otp);
      navigation.replace('/home');
    } catch (caught) {
      setError(readHttpErrorMessage(caught, t('verifyEmailFailed')));
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    setPending(true);
    setInfo('');
    try {
      await requestOtp(http);
      setInfo(t('otpSent'));
    } catch {
      // Web swallows resend failures.
    } finally {
      setPending(false);
    }
  }

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
          <BrandIllustration
            height={theme.layout.verifyIllustrationHeight}
            resizeMode="cover"
            style={{ alignSelf: 'center' }}
          />
          <View
            style={{
              width: '100%',
              maxWidth: theme.layout.authColumnMaxWidth,
              alignSelf: 'center',
            }}
          >
            <Text
              variant="title"
              style={{
                fontSize: 24,
                textAlign: 'center',
                marginTop: theme.space[6],
                marginBottom: theme.space[5],
              }}
            >
              {t('verifyEmailTitle')}
            </Text>
            {error ? (
              <AuthErrorBanner
                strong
                message={error}
                onDismiss={() => setError('')}
              />
            ) : null}
            {info ? (
              <Text
                muted
                style={{ marginBottom: theme.space[4], textAlign: 'center' }}
              >
                {info}
              </Text>
            ) : null}
            <Text
              variant="small"
              style={{
                fontFamily: theme.font.medium,
                marginBottom: theme.space[2],
              }}
            >
              {t('otp')}
            </Text>
            <TextInput
              testID="verify-otp"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                borderWidth: 1,
                borderColor: theme.color.inputBorder,
                borderRadius: 6,
                padding: theme.space[2],
                fontSize: theme.type.heading,
                fontFamily: theme.font.regular,
                color: theme.color.ink,
                marginBottom: theme.space[4],
              }}
            />
            <Pressable
              testID="verify-resend"
              accessibilityRole="button"
              accessibilityLabel={t('resendOtp')}
              onPress={() => void onResend()}
              disabled={pending}
              style={{ marginBottom: theme.space[4] }}
            >
              <Text style={{ color: theme.color.link }}>{t('resendOtp')}</Text>
            </Pressable>
            <Pressable
              testID="verify-submit"
              accessibilityRole="button"
              accessibilityLabel={t('verifyEmail')}
              disabled={pending}
              onPress={() => void onVerify()}
              style={{
                alignItems: 'center',
                backgroundColor: theme.color.verifySubmit,
                paddingVertical: theme.space[2],
                borderRadius: 6,
                opacity: pending ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  color: theme.color.accentText,
                  fontFamily: theme.font.medium,
                }}
              >
                {pending ? t('loading') : t('verifyEmail')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

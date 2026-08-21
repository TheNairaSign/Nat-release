import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { resetPasswordWithToken, verifyResetToken } from '../api/auth-api';
import {
  LegacyAuthPage,
  LegacyBackLink,
  LegacyTextField,
  LimeButton,
  PasswordVisibilityToggle,
} from '../ui';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Screen, Text } from '@/shared/ui';

export function ResetPasswordScreen({ token }: { token: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      navigation.replace('/forgot-password');
      return;
    }
    void (async () => {
      const result = await verifyResetToken(http, token);
      if (cancelled) return;
      if (!result.valid) {
        navigation.replace('/forgot-password');
        return;
      }
      setEmail(result.email);
      setValid(true);
      setVerifying(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [http, navigation, token]);

  async function onSubmit() {
    if (!password || !confirmPassword) {
      setMessage(t('allFieldsRequired'));
      return;
    }
    if (password.length < 8) {
      setMessage(t('passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setMessage(t('passwordsDoNotMatch'));
      return;
    }
    setPending(true);
    setMessage('');
    try {
      const result = await resetPasswordWithToken(http, token, password);
      if (result.ok) {
        navigation.replace('/sign-in');
        return;
      }
      setMessage(result.message);
    } finally {
      setPending(false);
    }
  }

  if (verifying || !valid) {
    return (
      <Screen>
        <Text muted style={{ textAlign: 'center' }}>
          {t('verifyingResetLink')}
        </Text>
      </Screen>
    );
  }

  return (
    <LegacyAuthPage>
      <Text
        variant="title"
        style={{ fontSize: 24, marginBottom: theme.space[4] }}
      >
        {t('resetPasswordTitle')}
      </Text>
      <Text style={{ marginBottom: theme.space[5] }}>
        {t('resetPasswordBody')}{' '}
        <Text style={{ fontFamily: theme.font.bold }}>{email}</Text>
      </Text>
      {message ? (
        <Text
          style={{ color: theme.color.danger, marginBottom: theme.space[4] }}
        >
          {message}
        </Text>
      ) : null}

      <Text
        style={{
          color: theme.color.label,
          fontFamily: theme.font.medium,
          marginBottom: 4,
        }}
      >
        {t('newPassword')}
      </Text>
      <View style={{ justifyContent: 'center' }}>
        <LegacyTextField
          testID="reset-password"
          placeholder={t('newPasswordPlaceholder')}
          autoCapitalize="none"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={{ paddingRight: 44, marginBottom: theme.space[4] }}
        />
        <PasswordVisibilityToggle
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
          hideLabel={t('hidePassword')}
          showLabel={t('showPassword')}
        />
      </View>

      <Text
        style={{
          color: theme.color.label,
          fontFamily: theme.font.medium,
          marginBottom: 4,
        }}
      >
        {t('confirmPassword')}
      </Text>
      <View style={{ justifyContent: 'center' }}>
        <LegacyTextField
          testID="reset-confirm-password"
          placeholder={t('confirmNewPasswordPlaceholder')}
          autoCapitalize="none"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{
            paddingRight: 44,
            marginBottom: theme.space[2],
            borderColor:
              confirmPassword.length > 0 && !passwordsMatch
                ? theme.color.danger
                : theme.color.inputBorder,
          }}
        />
        <PasswordVisibilityToggle
          visible={showConfirm}
          onToggle={() => setShowConfirm((visible) => !visible)}
          hideLabel={t('hidePassword')}
          showLabel={t('showPassword')}
        />
      </View>
      {confirmPassword.length > 0 ? (
        <Text
          variant="small"
          style={{
            color: passwordsMatch ? '#16a34a' : theme.color.danger,
            marginBottom: theme.space[4],
          }}
        >
          {passwordsMatch ? t('passwordsMatch') : t('passwordsDoNotMatch')}
        </Text>
      ) : (
        <View style={{ height: theme.space[4] }} />
      )}

      <LimeButton
        testID="reset-submit"
        label={pending ? t('resetting') : t('resetPassword')}
        disabled={pending || !passwordsMatch || password.length < 8}
        onPress={() => void onSubmit()}
      />
      <LegacyBackLink
        label={t('backToSignIn')}
        onPress={() => navigation.replace('/sign-in')}
      />
    </LegacyAuthPage>
  );
}

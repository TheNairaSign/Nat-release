import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset } from '../api/auth-api';
import {
  LegacyAuthPage,
  LegacyBackLink,
  LegacyTextField,
  LimeButton,
} from '../ui';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

export function ForgotPasswordScreen({ notice }: { notice?: string } = {}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  // A reset link that was missing or expired redirects here; web toasts the
  // reason, so mobile seeds the same copy into the inline message instead.
  const [message, setMessage] = useState(() =>
    notice === 'invalidResetLink' || notice === 'invalidOrExpiredResetLink'
      ? t(notice)
      : '',
  );
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  async function onSubmit() {
    if (!email.trim()) {
      setMessage(t('emailRequired'));
      return;
    }
    setPending(true);
    setMessage('');
    try {
      await requestPasswordReset(http, email.trim());
    } finally {
      setMessage(t('resetLinkSent'));
      setPending(false);
      redirectTimer.current = setTimeout(
        () => navigation.replace('/sign-in'),
        3000,
      );
    }
  }

  return (
    <LegacyAuthPage>
      <Text
        variant="title"
        style={{ fontSize: 24, marginBottom: theme.space[4] }}
      >
        {t('forgotPasswordTitle')}
      </Text>
      <Text style={{ marginBottom: theme.space[5] }}>
        {t('forgotPasswordBody')}
      </Text>
      {message ? (
        <Text style={{ marginBottom: theme.space[4] }}>{message}</Text>
      ) : null}
      <LegacyTextField
        testID="forgot-email"
        placeholder={t('enterEmail')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <LimeButton
        testID="forgot-submit"
        label={pending ? t('sending') : t('sendResetLink')}
        disabled={pending}
        onPress={() => void onSubmit()}
      />
      <LegacyBackLink
        label={t('backToSignIn')}
        onPress={() => navigation.replace('/sign-in')}
      />
    </LegacyAuthPage>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';

import { PENDING_DROPOFF_KEY } from '@/core/dropoff';
import { signIn } from '../api/auth-api';
import { useSession } from '../hooks/use-session';
import {
  AuthErrorBanner,
  AuthFieldCard,
  AuthHairline,
  AuthPage,
  AuthScreenPrompt,
  AuthSplitCta,
  AuthTextField,
  AuthTextLink,
  PasswordVisibilityToggle,
  ThingsMatchLink,
} from '../ui';
import { readHttpErrorMessage } from '@/shared/api/errors';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { BrandIllustration, BrandLogo, Text } from '@/shared/ui';

export function SignInScreen({
  redirectTo = '/home',
}: {
  redirectTo?: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { http, navigation, kv } = usePorts();
  const { persist } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const illustrationHeight = Math.min(
    height * theme.layout.illustrationVh,
    theme.layout.illustrationMaxHeight,
  );

  async function onSignIn() {
    if (!email.trim() || !password) {
      setError(t('signInFailed'));
      return;
    }
    setPending(true);
    setError('');
    try {
      const session = await signIn(http, email.trim(), password);
      await persist(session);
      const pendingHref = await kv.get<string>(PENDING_DROPOFF_KEY);
      if (typeof pendingHref === 'string' && pendingHref.length > 0) {
        await kv.remove(PENDING_DROPOFF_KEY);
        navigation.replace(pendingHref);
      } else {
        navigation.replace(redirectTo);
      }
    } catch (caught) {
      setError(readHttpErrorMessage(caught, t('signInFailed')));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPage>
      <BrandLogo
        style={{ alignSelf: 'center', marginBottom: theme.space[5] }}
      />
      <BrandIllustration
        height={illustrationHeight}
        style={{
          alignSelf: 'center',
          marginBottom: theme.layout.illustrationMarginBottom,
        }}
      />
      <Text
        variant="heading"
        style={{
          textAlign: 'center',
          letterSpacing: -0.55,
          marginBottom: theme.space[5],
        }}
      >
        {t('welcomeBack')}
      </Text>

      {error ? (
        <AuthErrorBanner message={error} onDismiss={() => setError('')} />
      ) : null}

      <View style={{ gap: theme.space[4] }}>
        <AuthFieldCard>
          <AuthTextField
            testID="sign-in-email"
            placeholder={t('emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <AuthHairline />
          <View style={{ justifyContent: 'center' }}>
            <AuthTextField
              testID="sign-in-password"
              placeholder={t('passwordPlaceholder')}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={{ paddingRight: 44 }}
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              hideLabel={t('hidePassword')}
              showLabel={t('showPassword')}
            />
          </View>
        </AuthFieldCard>

        <AuthTextLink
          label={t('forgotPassword')}
          onPress={() => navigation.navigate('/forgot-password')}
        />

        <AuthSplitCta
          secondary={{
            label: t('browseAsGuest'),
            onPress: () => navigation.replace('/guest/dashboard'),
            testID: 'sign-in-guest',
          }}
          primary={{
            label: pending ? t('signingIn') : t('signIn'),
            onPress: () => void onSignIn(),
            testID: 'sign-in-submit',
            disabled: pending,
          }}
        />
      </View>

      <AuthScreenPrompt
        prompt={t('noAccount')}
        actionLabel={t('signUp')}
        onPress={() => navigation.navigate('/sign-up')}
      />
      <ThingsMatchLink label={t('openThingsMatch')} />
    </AuthPage>
  );
}

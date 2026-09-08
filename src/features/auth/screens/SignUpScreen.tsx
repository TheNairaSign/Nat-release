import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { fetchThingsMatchAccountToken, signUp } from '../api/auth-api';
import { useSession } from '../hooks/use-session';
import { useSignupForm } from '../hooks/use-signup-form';
import {
  GENDER_OPTIONS,
  groupedSignupError,
  wantsThingsMatchFlow,
} from '../model/signup-validation';
import {
  AuthErrorBanner,
  AuthFieldCard,
  AuthFieldError,
  AuthHairline,
  AuthPage,
  AuthPasswordRow,
  AuthPrimaryButton,
  AuthScreenPrompt,
  AuthSelectField,
  AuthTextField,
} from '../ui';
import { readHttpErrorMessage } from '@/shared/api/errors';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { BrandLogo, Text } from '@/shared/ui';

const THINGSMATCH_APP = 'https://thingsmatch.com/app';
const TERMS_URL = 'https://www.natcycle.com/terms-and-conditions/';
const PRIVACY_URL = 'https://www.natcycle.com/privacy-policy/';

export type SignUpQuery = {
  referral?: string;
  thingsmatch?: string;
  origin?: string;
  tm?: string;
};

export function SignUpScreen({ query = {} }: { query?: SignUpQuery }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { http, navigation, linking } = usePorts();
  const { persist } = useSession();
  const form = useSignupForm(query.referral ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    if (!form.validateAll()) {
      return;
    }
    if (!acceptedTerms) {
      setTermsError('Please agree to the Terms & Conditions to continue');
      return;
    }
    setTermsError('');
    setPending(true);
    setError('');
    try {
      const session = await signUp(http, {
        ...form.fields,
        referralId: form.referralId,
        acceptedTerms: true,
      });
      await persist(session);
      if (wantsThingsMatchFlow(query)) {
        const tmToken = await fetchThingsMatchAccountToken(http, session.token);
        if (tmToken) {
          await linking.openUrl(
            `${THINGSMATCH_APP}?token=${encodeURIComponent(tmToken)}`,
          );
          return;
        }
      }
      navigation.replace('/home');
    } catch (caught) {
      setError(readHttpErrorMessage(caught, t('signUpFailed')));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPage topRatio={theme.layout.signUpTopRatio}>
      <BrandLogo
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
        {t('createAccount')}
      </Text>

      {error ? (
        <AuthErrorBanner
          strong
          message={error}
          onDismiss={() => setError('')}
        />
      ) : null}

      <View style={{ gap: theme.space[4] }}>
        <AuthFieldCard elevated>
          <AuthTextField
            testID="sign-up-first-name"
            placeholder={t('firstNamePlaceholder')}
            autoComplete="given-name"
            textContentType="givenName"
            value={form.fields.firstName}
            onChangeText={(value) => form.change('firstName', value)}
          />
          <AuthHairline />
          <AuthTextField
            testID="sign-up-last-name"
            placeholder={t('lastNamePlaceholder')}
            autoComplete="family-name"
            textContentType="familyName"
            value={form.fields.lastName}
            onChangeText={(value) => form.change('lastName', value)}
          />
        </AuthFieldCard>
        <AuthFieldError
          message={groupedSignupError(form.errors, ['firstName', 'lastName'])}
        />

        <AuthFieldCard elevated>
          <AuthTextField
            testID="sign-up-email"
            placeholder={t('emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={form.fields.email}
            onChangeText={(value) => form.change('email', value)}
          />
          <AuthHairline />
          <AuthTextField
            testID="sign-up-city"
            placeholder="Town / City *"
            autoComplete="postal-address"
            textContentType="addressCity"
            value={form.fields.city}
            onChangeText={(value) => form.change('city', value)}
          />
          <AuthHairline />
          <AuthTextField
            testID="sign-up-age"
            placeholder={t('agePlaceholder')}
            keyboardType="number-pad"
            value={form.fields.age}
            onChangeText={(value) => form.change('age', value)}
          />
          <AuthHairline />
          <AuthSelectField
            testID="sign-up-gender"
            value={form.fields.gender}
            placeholder={t('genderPlaceholder')}
            options={GENDER_OPTIONS}
            onChange={(value) => form.change('gender', value)}
          />
        </AuthFieldCard>
        <AuthFieldError
          message={groupedSignupError(form.errors, [
            'email',
            'city',
            'age',
            'gender',
          ])}
        />

        <AuthFieldCard elevated>
          <AuthPasswordRow
            testID="sign-up-password"
            placeholder={t('passwordPlaceholder')}
            autoComplete="password-new"
            textContentType="newPassword"
            value={form.fields.password}
            onChangeText={(value) => form.change('password', value)}
            visible={showPassword}
            onToggle={() => setShowPassword((visible) => !visible)}
            hideLabel={t('hidePassword')}
            showLabel={t('showPassword')}
            eyeSize={theme.layout.signupEyeSize}
          />
          <AuthHairline />
          <AuthPasswordRow
            testID="sign-up-confirm-password"
            placeholder={t('confirmPasswordPlaceholder')}
            autoComplete="password-new"
            textContentType="newPassword"
            value={form.fields.confirmPassword}
            onChangeText={(value) => form.change('confirmPassword', value)}
            visible={showConfirm}
            onToggle={() => setShowConfirm((visible) => !visible)}
            hideLabel={t('hidePassword')}
            showLabel={t('showPassword')}
            eyeSize={theme.layout.signupEyeSize}
          />
        </AuthFieldCard>
        <AuthFieldError
          message={groupedSignupError(form.errors, [
            'password',
            'confirmPassword',
          ])}
        />

        <AuthFieldCard elevated>
          <AuthTextField
            testID="sign-up-referral"
            placeholder={t('referralPlaceholder')}
            autoCapitalize="none"
            value={form.referralId}
            onChangeText={form.setReferralId}
          />
        </AuthFieldCard>

        <Pressable
          testID="sign-up-terms"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => {
            setAcceptedTerms((value) => {
              const next = !value;
              if (next) setTermsError('');
              return next;
            });
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: theme.space[3],
            paddingHorizontal: 4,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              marginTop: 2,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: acceptedTerms ? theme.color.accent : theme.color.inputBorder,
              backgroundColor: acceptedTerms ? theme.color.accent : theme.color.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptedTerms ? (
              <Text style={{ color: theme.color.accentText, fontSize: 12 }}>✓</Text>
            ) : null}
          </View>
          <Text
            variant="small"
            style={{ flex: 1, color: theme.color.textMuted, lineHeight: 18 }}
          >
            I agree to the{' '}
            <Text
              variant="small"
              onPress={() => {
                void Linking.openURL(TERMS_URL);
              }}
              style={{
                color: theme.color.accent,
                textDecorationLine: 'underline',
                fontFamily: theme.font.medium,
              }}
            >
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text
              variant="small"
              onPress={() => {
                void Linking.openURL(PRIVACY_URL);
              }}
              style={{
                color: theme.color.accent,
                textDecorationLine: 'underline',
                fontFamily: theme.font.medium,
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>
        <AuthFieldError message={termsError} />

        <AuthPrimaryButton
          testID="sign-up-submit"
          label={pending ? t('creatingAccount') : t('signUp')}
          disabled={pending}
          onPress={() => void onSubmit()}
        />
      </View>

      <AuthScreenPrompt
        prompt={t('alreadyHaveAccount')}
        actionLabel={t('signIn')}
        onPress={() => navigation.replace('/sign-in')}
      />
    </AuthPage>
  );
}

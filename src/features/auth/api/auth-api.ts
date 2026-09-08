import { z } from 'zod';

import { sessionFromSignIn } from '../model/session-schema';
import type { SignupFields } from '../model/signup-validation';
import type { Session } from '@/core/session';
import { assertOk } from '@/shared/api/errors';
import type { HttpClient } from '@/shared/ports/http';

const thingsMatchTokenSchema = z
  .object({ token: z.string().min(1) })
  .passthrough();
const resetTokenSchema = z
  .object({
    status: z.boolean(),
    email: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();
const resetPasswordSchema = z
  .object({
    status: z.boolean().optional(),
    message: z.string().optional(),
    sameAsOld: z.boolean().optional(),
  })
  .passthrough();

export type SignupPayload = SignupFields & {
  referralId: string;
  acceptedTerms?: boolean;
};

export async function signIn(
  http: HttpClient,
  email: string,
  password: string,
): Promise<Session> {
  const response = await http.request({
    path: '/auth/signin',
    method: 'POST',
    body: { email, password },
  });
  assertOk(response.status, response.body);
  return sessionFromSignIn(response.body);
}

export async function signUp(
  http: HttpClient,
  payload: SignupPayload,
): Promise<Session> {
  const response = await http.request({
    path: '/auth/signup',
    method: 'POST',
    body: payload,
  });
  assertOk(response.status, response.body);
  return sessionFromSignIn(response.body);
}

export async function fetchThingsMatchAccountToken(
  http: HttpClient,
  authToken: string,
): Promise<string | null> {
  const response = await http.request({
    path: `/thingsMatch/auth/thingsMatchAccount/${authToken}`,
    method: 'GET',
  });
  if (response.status < 200 || response.status >= 300) {
    return null;
  }
  const parsed = thingsMatchTokenSchema.safeParse(response.body);
  return parsed.success ? parsed.data.token : null;
}

export async function verifyEmail(
  http: HttpClient,
  otp: string,
): Promise<void> {
  const response = await http.request({
    path: '/auth/verify-email',
    method: 'POST',
    body: { otp },
  });
  assertOk(response.status, response.body);
}

export async function requestOtp(http: HttpClient): Promise<void> {
  const response = await http.request({
    path: '/auth/request-otp',
    method: 'GET',
  });
  assertOk(response.status, response.body);
}

export async function requestPasswordReset(
  http: HttpClient,
  email: string,
): Promise<void> {
  const response = await http.request({
    path: '/auth/request-password-reset',
    method: 'POST',
    body: { email },
  });
  if (response.status === 0) {
    assertOk(response.status, response.body);
  }
}

export async function verifyResetToken(
  http: HttpClient,
  token: string,
): Promise<{ valid: boolean; email: string }> {
  const response = await http.request({
    path: '/auth/verify-reset-token',
    method: 'POST',
    body: { token },
  });
  if (response.status < 200 || response.status >= 300) {
    return { valid: false, email: '' };
  }
  const parsed = resetTokenSchema.safeParse(response.body);
  if (!parsed.success || !parsed.data.status) {
    return { valid: false, email: '' };
  }
  return { valid: true, email: parsed.data.email ?? '' };
}

export async function resetPasswordWithToken(
  http: HttpClient,
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string; sameAsOld: boolean }> {
  const response = await http.request({
    path: '/auth/reset-password-with-token',
    method: 'POST',
    body: { token, newPassword },
  });
  const parsed = resetPasswordSchema.safeParse(response.body);
  const message =
    parsed.success && parsed.data.message
      ? parsed.data.message
      : 'An error occurred. Please try again.';
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message,
      sameAsOld: parsed.success ? Boolean(parsed.data.sameAsOld) : false,
    };
  }
  if (parsed.success && parsed.data.status === false) {
    return { ok: false, message, sameAsOld: Boolean(parsed.data.sameAsOld) };
  }
  return { ok: true, message: '', sameAsOld: false };
}

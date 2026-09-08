import {
  fetchThingsMatchAccountToken,
  requestOtp,
  requestPasswordReset,
  resetPasswordWithToken,
  signIn,
  signUp,
  verifyEmail,
  verifyResetToken,
} from '../api/auth-api';
import { HttpError } from '@/shared/api/errors';

describe('signIn', () => {
  it('maps a live token and user _id into a session', async () => {
    const http = {
      request: async () => ({
        status: 200,
        body: {
          token: 'jwt-1',
          user: { _id: 'user-1', email: 'ada@natcycle.app' },
        },
      }),
    };
    await expect(signIn(http, 'ada@natcycle.app', 'secret')).resolves.toEqual({
      token: 'jwt-1',
      userId: 'user-1',
    });
  });

  it('throws on a 400 string body from the API', async () => {
    const http = {
      request: async () => ({ status: 400, body: 'Email does not exist' }),
    };
    await expect(
      signIn(http, 'missing@x.com', 'secret'),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('does not invent a stub session on a 500', async () => {
    const http = {
      request: async () => ({ status: 500, body: 'Server error' }),
    };
    await expect(
      signIn(http, 'ada@natcycle.app', 'secret'),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

describe('requestPasswordReset', () => {
  it('posts the email and ignores non-zero error statuses like web', async () => {
    const http = {
      request: jest.fn(async () => ({ status: 404, body: 'not found' })),
    };
    await expect(
      requestPasswordReset(http, 'ada@natcycle.app'),
    ).resolves.toBeUndefined();
    expect(http.request).toHaveBeenCalledWith({
      path: '/auth/request-password-reset',
      method: 'POST',
      body: { email: 'ada@natcycle.app' },
    });
  });
});

describe('signUp', () => {
  it('maps token and user _id into a session', async () => {
    const http = {
      request: async () => ({
        status: 200,
        body: { token: 'jwt-1', user: { _id: 'user-1' } },
      }),
    };
    await expect(
      signUp(http, {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@natcycle.app',
        password: 'Secret1x',
        confirmPassword: 'Secret1x',
        age: '28',
        gender: 'female',
        city: 'Hamden',
        referralId: '',
        acceptedTerms: true,
      }),
    ).resolves.toEqual({ token: 'jwt-1', userId: 'user-1' });
  });
});

describe('verifyEmail', () => {
  it('posts the OTP', async () => {
    const http = {
      request: jest.fn(async () => ({ status: 200, body: {} })),
    };
    await verifyEmail(http, '123456');
    expect(http.request).toHaveBeenCalledWith({
      path: '/auth/verify-email',
      method: 'POST',
      body: { otp: '123456' },
    });
  });
});

describe('requestOtp', () => {
  it('calls GET /auth/request-otp', async () => {
    const http = {
      request: jest.fn(async () => ({ status: 200, body: {} })),
    };
    await requestOtp(http);
    expect(http.request).toHaveBeenCalledWith({
      path: '/auth/request-otp',
      method: 'GET',
    });
  });
});

describe('reset token helpers', () => {
  it('reads a valid reset token payload', async () => {
    const http = {
      request: async () => ({
        status: 200,
        body: { status: true, email: 'ada@natcycle.app' },
      }),
    };
    await expect(verifyResetToken(http, 'tok')).resolves.toEqual({
      valid: true,
      email: 'ada@natcycle.app',
    });
  });

  it('returns ok false when reset reports status false', async () => {
    const http = {
      request: async () => ({
        status: 200,
        body: { status: false, message: 'too weak' },
      }),
    };
    await expect(
      resetPasswordWithToken(http, 'tok', 'Secret1x'),
    ).resolves.toEqual({
      ok: false,
      message: 'too weak',
      sameAsOld: false,
    });
  });
});

describe('fetchThingsMatchAccountToken', () => {
  it('returns null when the body has no token', async () => {
    const http = {
      request: async () => ({ status: 200, body: {} }),
    };
    await expect(
      fetchThingsMatchAccountToken(http, 'jwt-1'),
    ).resolves.toBeNull();
  });
});

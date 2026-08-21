import { fireEvent, screen } from '@testing-library/react-native';

import { ForgotPasswordScreen } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

describe('ForgotPasswordScreen', () => {
  it('requires an email before posting', async () => {
    const request = jest.fn();
    await renderWithProviders(<ForgotPasswordScreen />, {
      ports: { http: { request } },
    });
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it('always shows the generic sent copy after a request', async () => {
    const request = jest.fn(async () => ({ status: 404, body: 'missing' }));
    await renderWithProviders(<ForgotPasswordScreen />, {
      ports: { http: { request } },
    });
    await fireEvent.changeText(
      screen.getByTestId('forgot-email'),
      'ada@natcycle.app',
    );
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    expect(
      await screen.findByText(
        'If an account exists, we have sent a reset link.',
      ),
    ).toBeTruthy();
    expect(request).toHaveBeenCalledWith({
      path: '/auth/request-password-reset',
      method: 'POST',
      body: { email: 'ada@natcycle.app' },
    });
  });
});

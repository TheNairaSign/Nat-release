import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { VerifyEmailScreen } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

describe('VerifyEmailScreen', () => {
  it('rejects a short OTP without calling the API', async () => {
    const request = jest.fn();
    await renderWithProviders(<VerifyEmailScreen />, {
      ports: { http: { request } },
    });
    await fireEvent.changeText(screen.getByTestId('verify-otp'), '12');
    await fireEvent.press(screen.getByTestId('verify-submit'));
    expect(
      await screen.findByText('OTP must be 6 characters long'),
    ).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it('posts the OTP and replaces to home', async () => {
    const replace = jest.fn();
    const request = jest.fn(async () => ({ status: 200, body: { ok: true } }));
    await renderWithProviders(<VerifyEmailScreen />, {
      ports: {
        http: { request },
        navigation: { navigate() {}, replace, back() {} },
      },
    });
    await fireEvent.changeText(screen.getByTestId('verify-otp'), '123456');
    await fireEvent.press(screen.getByTestId('verify-submit'));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/home');
    });
    expect(request).toHaveBeenCalledWith({
      path: '/auth/verify-email',
      method: 'POST',
      body: { otp: '123456' },
    });
  });
});

import { screen, waitFor } from '@testing-library/react-native';

import { ResetPasswordScreen } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

describe('ResetPasswordScreen', () => {
  it('sends a missing token back to forgot-password', async () => {
    const replace = jest.fn();
    await renderWithProviders(<ResetPasswordScreen token="" />, {
      ports: {
        navigation: { navigate() {}, replace, back() {} },
      },
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/forgot-password');
    });
  });

  it('shows the email after a valid token', async () => {
    await renderWithProviders(<ResetPasswordScreen token="reset-1" />, {
      ports: {
        http: {
          request: async () => ({
            status: 200,
            body: { status: true, email: 'ada@natcycle.app' },
          }),
        },
      },
    });
    expect(await screen.findByText('ada@natcycle.app')).toBeTruthy();
  });
});

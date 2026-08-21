import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SignInScreen, useSessionStore } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

describe('SignInScreen', () => {
  it('signs in against the API and replaces to home', async () => {
    const replace = jest.fn();
    const request = jest.fn(async () => ({
      status: 200,
      body: { token: 'jwt-1', user: { _id: 'user-1' } },
    }));

    await renderWithProviders(<SignInScreen />, {
      ports: {
        http: { request },
        navigation: { navigate() {}, replace, back() {} },
      },
    });

    await fireEvent.changeText(
      screen.getByTestId('sign-in-email'),
      'ada@natcycle.app',
    );
    await fireEvent.changeText(
      screen.getByTestId('sign-in-password'),
      'secret',
    );
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/home');
    });
    expect(request).toHaveBeenCalledWith({
      path: '/auth/signin',
      method: 'POST',
      body: { email: 'ada@natcycle.app', password: 'secret' },
    });
  });

  it('honors a post-login redirect', async () => {
    const replace = jest.fn();
    await renderWithProviders(<SignInScreen redirectTo="/where" />, {
      ports: {
        http: {
          request: async () => ({
            status: 200,
            body: { token: 'jwt-1', user: { _id: 'user-1' } },
          }),
        },
        navigation: { navigate() {}, replace, back() {} },
      },
    });
    await fireEvent.changeText(
      screen.getByTestId('sign-in-email'),
      'ada@natcycle.app',
    );
    await fireEvent.changeText(
      screen.getByTestId('sign-in-password'),
      'secret',
    );
    await fireEvent.press(screen.getByTestId('sign-in-submit'));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/where');
    });
  });

  it('shows the API error string on a failed sign-in', async () => {
    await renderWithProviders(<SignInScreen />, {
      ports: {
        http: {
          request: async () => ({ status: 400, body: 'Email does not exist' }),
        },
      },
    });

    await fireEvent.changeText(
      screen.getByTestId('sign-in-email'),
      'missing@x.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('sign-in-password'),
      'secret',
    );
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(screen.getByText('Email does not exist')).toBeTruthy();
    });
  });

  it('lets a guest browse without a session or sign-in request', async () => {
    const replace = jest.fn();
    const request = jest.fn();

    await renderWithProviders(<SignInScreen />, {
      ports: {
        http: { request },
        navigation: { navigate() {}, replace, back() {} },
      },
    });

    await fireEvent.press(screen.getByTestId('sign-in-guest'));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/guest/dashboard');
    });
    expect(request).not.toHaveBeenCalled();
    expect(useSessionStore.getState().session).toBeNull();
  });
});

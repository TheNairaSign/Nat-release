import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SignUpScreen } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

async function fillValidSignup() {
  await fireEvent.changeText(screen.getByTestId('sign-up-first-name'), 'Ada');
  await fireEvent.changeText(
    screen.getByTestId('sign-up-last-name'),
    'Lovelace',
  );
  await fireEvent.changeText(
    screen.getByTestId('sign-up-email'),
    'ada@natcycle.app',
  );
  await fireEvent.changeText(screen.getByTestId('sign-up-city'), 'Hamden');
  await fireEvent.changeText(screen.getByTestId('sign-up-age'), '28');
  await fireEvent.press(screen.getByTestId('sign-up-gender'));
  await fireEvent.press(screen.getByTestId('sign-up-gender-female'));
  await fireEvent.changeText(
    screen.getByTestId('sign-up-password'),
    'Secret1x',
  );
  await fireEvent.changeText(
    screen.getByTestId('sign-up-confirm-password'),
    'Secret1x',
  );
}

describe('SignUpScreen', () => {
  it('shows field errors without calling the API when the form is empty', async () => {
    const request = jest.fn();
    await renderWithProviders(<SignUpScreen />, {
      ports: { http: { request } },
    });

    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    expect(await screen.findByText('First name is required')).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it('posts signup and replaces to home', async () => {
    const replace = jest.fn();
    const request = jest.fn(async () => ({
      status: 200,
      body: { token: 'jwt-1', user: { _id: 'user-1' } },
    }));

    await renderWithProviders(<SignUpScreen />, {
      ports: {
        http: { request },
        navigation: { navigate() {}, replace, back() {} },
      },
    });

    await fillValidSignup();
    await fireEvent.press(screen.getByTestId('sign-up-terms'));
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/home');
    });
    expect(request).toHaveBeenCalledWith({
      path: '/auth/signup',
      method: 'POST',
      body: expect.objectContaining({
        email: 'ada@natcycle.app',
        firstName: 'Ada',
        city: 'Hamden',
        gender: 'female',
        referralId: '',
        acceptedTerms: true,
      }),
    });
  });

  it('opens ThingsMatch when the query asks for that flow', async () => {
    const replace = jest.fn();
    const openUrl = jest.fn(async () => {});
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path.startsWith('/thingsMatch/')) {
        return { status: 200, body: { token: 'tm-token' } };
      }
      return { status: 200, body: { token: 'jwt-1', user: { _id: 'user-1' } } };
    });

    await renderWithProviders(<SignUpScreen query={{ thingsmatch: '1' }} />, {
      ports: {
        http: { request },
        linking: { openUrl },
        navigation: { navigate() {}, replace, back() {} },
      },
    });

    await fillValidSignup();
    await fireEvent.press(screen.getByTestId('sign-up-terms'));
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => {
      expect(openUrl).toHaveBeenCalledWith(
        'https://thingsmatch.com/app?token=tm-token',
      );
    });
    expect(replace).not.toHaveBeenCalled();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';

import { GuestSignInModal } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

describe('GuestSignInModal', () => {
  it('navigates to sign-in with a where redirect', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<GuestSignInModal open onClose={() => {}} />, {
      ports: {
        navigation: { navigate, replace() {}, back() {} },
      },
    });

    await fireEvent.press(screen.getByTestId('guest-modal-sign-in'));
    expect(navigate).toHaveBeenCalledWith('/sign-in?redirect=/where');
  });
});

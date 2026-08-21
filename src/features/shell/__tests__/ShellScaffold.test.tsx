import { fireEvent, screen } from '@testing-library/react-native';

import { ShellScaffold } from '@/features/shell';
import { Text } from '@/shared/ui';
import { renderWithProviders } from '@/test/render';

describe('ShellScaffold', () => {
  it('opens the locked-tab callback for guest Impact', async () => {
    const onLockedTab = jest.fn();
    await renderWithProviders(
      <ShellScaffold
        guest
        pathname="/guest/dashboard"
        onLockedTab={onLockedTab}
      >
        <Text>child</Text>
      </ShellScaffold>,
    );

    await fireEvent.press(screen.getByTestId('tab-impact'));
    expect(onLockedTab).toHaveBeenCalled();
  });

  it('navigates to guest Where', async () => {
    const navigate = jest.fn();
    await renderWithProviders(
      <ShellScaffold guest pathname="/guest/dashboard" onLockedTab={() => {}}>
        <Text>child</Text>
      </ShellScaffold>,
      {
        ports: {
          navigation: { navigate, replace() {}, back() {} },
        },
      },
    );

    await fireEvent.press(screen.getByTestId('tab-where'));
    expect(navigate).toHaveBeenCalledWith('/guest/where');
  });
});

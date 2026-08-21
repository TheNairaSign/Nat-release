import { render } from '@testing-library/react-native';

import { Text } from '@/shared/ui/Text';
import { ThemeProvider } from '@/shared/theme';

describe('Text', () => {
  it('renders children', async () => {
    const view = await render(
      <ThemeProvider>
        <Text>Hello</Text>
      </ThemeProvider>,
    );
    expect(view.getByText('Hello')).toBeTruthy();
  });
});

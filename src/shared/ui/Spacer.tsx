import { View } from 'react-native';

import { space } from '@/shared/theme/tokens';

export function Spacer({ size = 4 }: { size?: keyof typeof space }) {
  return <View style={{ height: space[size] }} />;
}

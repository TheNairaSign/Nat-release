import { Pressable } from 'react-native';

import { EyeIcon } from '@/shared/ui/icons/EyeIcon';
import { useTheme } from '@/shared/theme';

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  hideLabel,
  showLabel,
  size,
}: {
  visible: boolean;
  onToggle: () => void;
  hideLabel: string;
  showLabel: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? hideLabel : showLabel}
      onPress={onToggle}
      hitSlop={10}
      style={{
        position: 'absolute',
        right: theme.space[3],
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingHorizontal: 6,
      }}
    >
      <EyeIcon
        slashed={visible}
        color={theme.color.placeholder}
        size={size ?? theme.layout.eyeSize}
      />
    </Pressable>
  );
}

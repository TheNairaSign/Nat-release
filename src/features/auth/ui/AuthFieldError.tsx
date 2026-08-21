import { Text } from '@/shared/ui/Text';
import { useTheme } from '@/shared/theme';

export function AuthFieldError({ message }: { message: string }) {
  const theme = useTheme();
  if (!message) {
    return null;
  }
  return (
    <Text
      style={{
        color: theme.color.errorDismiss,
        fontSize: 12,
        paddingHorizontal: 4,
        paddingTop: 4,
      }}
    >
      {message}
    </Text>
  );
}

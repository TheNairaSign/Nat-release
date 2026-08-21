import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function HomeNoticeBanner({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ marginTop: theme.space[5], marginHorizontal: theme.space[4] }}
    >
      <View
        style={{
          padding: theme.space[4],
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.noticeBg,
          borderWidth: 1,
          borderColor: theme.color.noticeBorder,
        }}
      >
        <Text
          variant="small"
          style={{
            fontFamily: theme.font.semibold,
            color: theme.color.noticeTitle,
          }}
        >
          {title}
        </Text>
        <Text
          variant="small"
          style={{ color: theme.color.noticeBody, marginTop: 4 }}
        >
          {body}
        </Text>
        <Text
          variant="small"
          style={{
            marginTop: theme.space[3],
            fontFamily: theme.font.medium,
            color: theme.color.noticeAction,
          }}
        >
          {action}
        </Text>
      </View>
    </Pressable>
  );
}

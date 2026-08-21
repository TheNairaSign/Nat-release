import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function AuthSelectField({
  value,
  placeholder,
  options,
  onChange,
  testID,
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
        onPress={() => setOpen((current) => !current)}
        style={{
          paddingHorizontal: theme.layout.fieldPadX,
          paddingVertical: theme.layout.fieldPadY,
        }}
      >
        <Text
          style={{
            color: value ? theme.color.label : theme.color.placeholder,
            fontFamily: theme.font.regular,
          }}
        >
          {value || placeholder}
        </Text>
      </Pressable>
      {open
        ? options.map((option) => (
            <Pressable
              key={option}
              testID={testID ? `${testID}-${option}` : undefined}
              accessibilityRole="button"
              accessibilityLabel={option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={{
                paddingHorizontal: theme.layout.fieldPadX,
                paddingVertical: theme.space[3],
                backgroundColor:
                  option === value ? theme.color.band : theme.color.surface,
              }}
            >
              <Text>{option}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

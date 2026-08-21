import { Pressable, ScrollView, View } from 'react-native';

import { capitalizeChip } from '@/core/materials';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function DisposeCard({
  greeting,
  loading,
  chips,
  selected,
  onSelect,
  onFindWhere,
}: {
  greeting: string;
  loading: boolean;
  chips: string[];
  selected: string | null;
  onSelect: (item: string) => void;
  onFindWhere: () => void;
}) {
  const theme = useTheme();
  const enabled = Boolean(selected);

  return (
    <View style={{ marginBottom: theme.layout.disposeOverlap }}>
      <View
        style={{
          backgroundColor: theme.color.lime,
          borderRadius: theme.radius.card28,
          paddingHorizontal: theme.space[5],
          paddingTop: 20,
          paddingBottom: theme.layout.disposeOverlap,
          minHeight: theme.layout.disposeMinHeight,
          overflow: 'visible',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: 'rgba(26, 26, 26, 0.9)',
            marginBottom: theme.space[2],
          }}
        >
          {greeting}
        </Text>
        <Text
          style={{
            fontSize: 26.4,
            lineHeight: 32,
            fontFamily: theme.font.bold,
            color: theme.color.ink,
            marginBottom: theme.space[4],
            minHeight: 52,
            paddingRight: theme.space[2],
          }}
        >
          What are you disposing?
        </Text>
        <View
          style={{
            height: theme.layout.chipRowHeight,
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
              {[0, 1, 2, 3].map((key) => (
                <View
                  key={key}
                  style={{
                    height: 36,
                    width: 80,
                    borderRadius: theme.radius.pill,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: theme.space[2],
                paddingHorizontal: 4,
                alignItems: 'center',
              }}
            >
              {chips.map((item) => {
                const active = selected === item;
                return (
                  <Pressable
                    key={item}
                    testID={`home-chip-${item}`}
                    accessibilityRole="button"
                    onPress={() => onSelect(item)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: theme.radius.pill,
                      backgroundColor: active
                        ? theme.color.ink
                        : theme.color.chipIdle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: theme.font.bold,
                        color: active
                          ? theme.color.accentText
                          : theme.color.ink,
                      }}
                    >
                      {capitalizeChip(item)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 0,
            transform: [{ translateY: theme.layout.findWhereShift }],
            alignItems: 'flex-end',
            zIndex: 20,
          }}
        >
          <Pressable
            testID="home-find-where"
            accessibilityRole="button"
            disabled={!enabled}
            onPress={onFindWhere}
            style={{
              width: '50%',
              paddingVertical: theme.space[4],
              paddingHorizontal: theme.space[3],
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.ink,
              opacity: enabled ? 1 : 0.5,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: theme.font.bold,
                color: theme.color.accentText,
              }}
            >
              Find where
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

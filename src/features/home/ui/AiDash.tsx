import { Pressable, ScrollView, View } from 'react-native';

import type { HomeSuggestion } from '../api/home-api';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

const THEMES = [
  { bg: 'aiBlue', border: 'aiBlueBorder' },
  { bg: 'aiAmber', border: 'aiAmberBorder' },
  { bg: 'aiGreen', border: 'aiGreenBorder' },
  { bg: 'aiPurple', border: 'aiPurpleBorder' },
] as const;

type SuggestionTone = (typeof THEMES)[number];

function toneFor(index: number): SuggestionTone {
  return THEMES[index % THEMES.length] as SuggestionTone;
}

export function AiDash({
  loading,
  suggestions,
  onOpenChat,
  onSuggestion,
}: {
  loading: boolean;
  suggestions: HomeSuggestion[];
  onOpenChat: () => void;
  onSuggestion: (item: HomeSuggestion) => void;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <View
        style={{
          marginTop: theme.space[6],
          paddingHorizontal: theme.space[2],
        }}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.color.borderSolid,
            borderRadius: 32,
            backgroundColor: theme.color.surface,
            height: 160,
            ...theme.shadow.md,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{ marginTop: theme.space[6], paddingHorizontal: theme.space[2] }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          marginBottom: theme.space[4],
        }}
      >
        <Text
          variant="small"
          style={{ fontFamily: theme.font.semibold, color: theme.color.text }}
        >
          Natcycle AI
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: theme.color.borderSolid,
          }}
        />
        <Pressable
          testID="home-open-chat"
          accessibilityRole="button"
          onPress={onOpenChat}
          style={{
            borderWidth: 1,
            borderColor: theme.color.borderSolid,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.space[3],
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.font.semibold,
              color: theme.color.label,
            }}
          >
            Open chat
          </Text>
        </Pressable>
      </View>
      {suggestions.length === 0 ? (
        <Text
          variant="small"
          muted
          style={{ fontStyle: 'italic', padding: theme.space[2] }}
        >
          No suggestions available at the moment.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.space[3], paddingHorizontal: 4 }}
        >
          {suggestions.map((suggestion, index) => {
            const tone = toneFor(index);
            return (
              <Pressable
                key={suggestion.id}
                testID={`home-suggestion-${suggestion.id}`}
                accessibilityRole="button"
                onPress={() => onSuggestion(suggestion)}
                style={{
                  width: theme.layout.aiCardWidth,
                  padding: theme.space[4],
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.color[tone.bg],
                  borderWidth: 1,
                  borderColor: theme.color[tone.border],
                  justifyContent: 'space-between',
                  minHeight: 96,
                }}
              >
                <Text
                  variant="small"
                  numberOfLines={2}
                  style={{
                    fontFamily: theme.font.medium,
                    color: theme.color.text,
                    marginBottom: theme.space[2],
                    lineHeight: 18,
                  }}
                >
                  {suggestion.text}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.font.semibold,
                    color: theme.color.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  Quick knowledge
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

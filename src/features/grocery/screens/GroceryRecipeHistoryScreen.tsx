import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AiMessage, UseUpRecipe } from '@/core/ai';
import { askDivaWith, fetchChatHistory, openChatSection, RecipeCard } from '@/features/ai';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { GroceryAppHeader } from '../ui/GroceryAppHeader';

type RecipeMessage = AiMessage & { recipe: UseUpRecipe };

function hasRecipe(message: AiMessage): message is RecipeMessage {
  return Boolean(message.recipe);
}

/** Newest first; a message with no timestamp sorts last. */
function byNewest(a: AiMessage, b: AiMessage): number {
  const at = a.timestamp ? Date.parse(a.timestamp) : 0;
  const bt = b.timestamp ? Date.parse(b.timestamp) : 0;
  return bt - at;
}

/**
 * Every recipe DiVA has made for this person in Grocery Manager, newest first, so they
 * don't have to scroll the chat to find one again. Reads the grocery section of the
 * chat (`fetchChatHistory(http, 'grocery')`) and picks out the messages carrying one.
 */
export function GroceryRecipeHistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation } = usePorts();
  const [openId, setOpenId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['ai', 'history', 'grocery'],
    queryFn: () => fetchChatHistory(http, 'grocery'),
  });

  const recipes = useMemo(
    () => (historyQuery.data ?? []).filter(hasRecipe).sort(byNewest),
    [historyQuery.data],
  );

  function askForAnother() {
    openChatSection('grocery');
    askDivaWith("What can I make with what's expiring?");
    navigation.navigate('/ai');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GroceryAppHeader title="My Recipes" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 + insets.bottom }}>
        {historyQuery.isPending ? (
          <View testID="recipe-history-skeleton">
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginTop: 12, height: 92, borderRadius: 18, backgroundColor: '#F8FAFC' }} />
            ))}
          </View>
        ) : recipes.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
              No recipes yet
            </Text>
            <Text
              style={{
                marginTop: 4,
                maxWidth: 240,
                textAlign: 'center',
                fontSize: 13,
                color: '#64748B',
              }}
            >
              Ask DiVA to use up something expiring, and the recipe lands here.
            </Text>
            <Pressable
              testID="recipe-history-ask"
              onPress={askForAnother}
              style={{
                marginTop: 16,
                borderRadius: 999,
                backgroundColor: '#D1FF52',
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>
                Ask for a recipe
              </Text>
            </Pressable>
          </View>
        ) : (
          recipes.map((message) => {
            const expanded = openId === message.id;
            return (
              <Pressable
                key={message.id}
                testID={`recipe-history-row-${message.id}`}
                onPress={() => setOpenId(expanded ? null : message.id)}
                style={{ marginTop: 12 }}
              >
                {expanded ? (
                  <RecipeCard recipe={message.recipe} feedbackRef={message.id} />
                ) : (
                  <View
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      backgroundColor: '#F7F8F4',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
                      {message.recipe.title}
                    </Text>
                    {message.recipe.uses.length > 0 ? (
                      <Text style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
                        {message.recipe.uses.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

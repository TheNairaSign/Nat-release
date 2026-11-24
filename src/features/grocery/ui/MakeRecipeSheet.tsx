import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  readUseUpIdeas,
  type AiMessage,
  type UseUpIdea,
  type UseUpRecipe,
} from '@/core/ai';
import { isAllowanceUsedUp } from '@/core/allowance';
import { buildUseUpRequest, type GroceryItem } from '@/core/grocery';
import { askAi, persistChatMessage } from '@/features/ai';
import { useSession } from '@/features/auth';
import { allowanceQueryKey } from '@/features/tokens';
import { useQuery, useQueryClient } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { XGlyph } from '@/shared/ui/icons/featherGlyphs';

/** A recipe as My recipes keeps it: the chat message's id, when, and the recipe. */
export type SavedRecipe = { id: string; timestamp: string; recipe: UseUpRecipe };

type Step =
  | { kind: 'ideas-loading' }
  | { kind: 'ideas'; ideas: UseUpIdea[]; context: Record<string, unknown> }
  | { kind: 'recipe-loading'; idea: UseUpIdea }
  | { kind: 'failed'; message: string }
  | { kind: 'out-of-tokens' };

/** Out of tokens gets its own message; web shows a toast that opens /tokens. */
function failure(error: unknown): Step {
  return isAllowanceUsedUp(error)
    ? { kind: 'out-of-tokens' }
    : { kind: 'failed', message: "DiVA couldn't come up with a recipe just now." };
}

/**
 * "Make new recipe" without a conversation (web components/grocery/MakeRecipeSheet, Nov
 * 18): DiVA's same use-it-up flow — ideas from the food about to expire, then the recipe
 * for the one picked — as a sheet. The recipe is saved to DiVA's grocery chat like one
 * made there, so it shows in My recipes and in DiVA alike. Tokens are charged as in chat.
 */
export function MakeRecipeSheet({
  items,
  onClose,
  onMade,
}: {
  items: GroceryItem[];
  onClose: () => void;
  onMade: (saved: SavedRecipe) => void;
}) {
  const theme = useTheme();
  const { http, navigation, uuid } = usePorts();
  const { session } = useSession();
  const queryClient = useQueryClient();
  // Made once, from the list as it was when the sheet opened; each opening asks afresh.
  const [request] = useState(() => buildUseUpRequest(items));
  const [opening] = useState(() => uuid.v4());
  /** After an idea is picked: writing it, or what went wrong. */
  const [picked, setPicked] = useState<Step | null>(null);
  const closed = useRef(false);
  const userId = session?.userId;

  useEffect(() => {
    closed.current = false;
    return () => {
      closed.current = true;
    };
  }, []);

  const ask = useCallback(
    async (question: string, context: Record<string, unknown>) => {
      try {
        return await askAi(http, {
          question,
          userId,
          history: [{ id: 'recipe-ask', role: 'user', text: question }],
          context,
        });
      } finally {
        // The question may have spent tokens: the profile and tokens page re-read them.
        void queryClient.invalidateQueries({ queryKey: allowanceQueryKey });
      }
    },
    [http, userId, queryClient],
  );

  const ideasQuery = useQuery({
    queryKey: ['grocery', 'recipe-ideas', opening],
    enabled: Boolean(request),
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    queryFn: async () => {
      const reply = await ask(request!.question, request!.context);
      return { ideas: readUseUpIdeas(reply.context), context: reply.context };
    },
  });

  /** What the sheet shows: the picked idea's progress first, then the ideas' own. */
  const step: Step = picked
    ? picked
    : !request
      ? { kind: 'failed', message: 'Add some groceries first, then ask for a recipe.' }
      : ideasQuery.isPending
        ? { kind: 'ideas-loading' }
        : ideasQuery.isError
          ? failure(ideasQuery.error)
          : ideasQuery.data.ideas.length === 0 || !ideasQuery.data.context
            ? { kind: 'failed', message: "DiVA couldn't come up with ideas just now." }
            : { kind: 'ideas', ideas: ideasQuery.data.ideas, context: ideasQuery.data.context };

  function retry() {
    setPicked(null);
    void ideasQuery.refetch();
  }

  async function pick(idea: UseUpIdea, context: Record<string, unknown>) {
    setPicked({ kind: 'recipe-loading', idea });
    try {
      const reply = await ask(idea.title, context);
      if (closed.current) return;
      if (!reply.recipe) {
        setPicked({ kind: 'failed', message: "DiVA couldn't write that recipe just now." });
        return;
      }
      const message: AiMessage = {
        id: uuid.v4(),
        role: 'assistant',
        text: reply.text,
        timestamp: new Date().toISOString(),
        recipe: reply.recipe,
        ...(reply.tokenCost ? { tokenCost: reply.tokenCost } : {}),
      };
      // Not saved: it still shows now, it just won't be there next visit.
      const savedId = await persistChatMessage(http, message, 'grocery').catch(() => undefined);
      onMade({ id: savedId ?? message.id, timestamp: message.timestamp!, recipe: reply.recipe });
    } catch (error) {
      if (!closed.current) setPicked(failure(error));
    }
  }

  return (
    <BottomSheet open onClose={onClose} testID="make-recipe-sheet">
      <View style={{ paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#010B02' }}>
              Make new recipe
            </Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: '#707070' }}>
              {step.kind === 'recipe-loading'
                ? `Writing ${step.idea.title}…`
                : "From your food that's about to expire. Pick one."}
            </Text>
          </View>
          <Pressable
            testID="make-recipe-close"
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            style={{ marginRight: -4, marginTop: -4, borderRadius: 999, padding: 6 }}
          >
            <XGlyph color="#64748B" size={20} />
          </Pressable>
        </View>

        {step.kind === 'ideas-loading' || step.kind === 'recipe-loading' ? (
          <View testID="make-recipe-loading" accessibilityLabel="DiVA is thinking" style={{ marginTop: 16, gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ height: 62, borderRadius: 16, backgroundColor: '#FFF4E0' }} />
            ))}
          </View>
        ) : null}

        {step.kind === 'ideas' ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {step.ideas.map((idea) => (
              <Pressable
                key={idea.title}
                testID={`make-recipe-idea-${idea.title}`}
                onPress={() => void pick(idea, step.context)}
                style={({ pressed }) => ({
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E2E2DA',
                  backgroundColor: '#FFF4E0',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <Text style={{ fontSize: 15, lineHeight: 19, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
                  {idea.title}
                </Text>
                {idea.why ? (
                  <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 17, color: '#1E0D2A', opacity: 0.7 }}>
                    {idea.why}
                  </Text>
                ) : null}
                {idea.uses.length > 0 ? (
                  <Text style={{ marginTop: 4, fontSize: 11, lineHeight: 15, color: '#1E0D2A', opacity: 0.5 }}>
                    Uses {idea.uses.join(', ')}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {step.kind === 'failed' ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center' }}>{step.message}</Text>
            <Pressable
              testID="make-recipe-retry"
              onPress={retry}
              style={{ marginTop: 12, borderRadius: 999, backgroundColor: '#D3FD5D', paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#010B02' }}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {step.kind === 'out-of-tokens' ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center' }}>
              You&apos;re out of AI tokens.
            </Text>
            <Pressable
              testID="make-recipe-tokens"
              onPress={() => {
                onClose();
                navigation.navigate('/tokens');
              }}
              style={{ marginTop: 12, borderRadius: 999, backgroundColor: '#D3FD5D', paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#010B02' }}>
                See your tokens and tiers
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import type { UseUpRecipe } from '@/core/ai';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { ClockGlyph, FeatherStarGlyph } from '@/shared/ui/icons/featherGlyphs';

import { rateRecipe } from '../api/recipe-feedback-api';

/** Same key as web's localStorage, so the shape of what's kept matches. */
const STORE = 'natcycle.recipeRatings';
const GOLD = '#F5B301';

type SendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * "How was this recipe?": 1 to 5 stars, then an optional line on why. Sent as feedback
 * on what DiVA suggests; tapping another star changes it. Web RecipeCard.tsx RecipeRating.
 */
function RecipeRating({
  recipe,
  feedbackRef,
}: {
  recipe: UseUpRecipe;
  feedbackRef: string;
}) {
  const theme = useTheme();
  const { http, kv } = usePorts();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<SendState>('idle');

  // Ratings already given on this device, so a reopened chat shows them.
  useEffect(() => {
    kv.get<Record<string, number>>(STORE)
      .then((all) => {
        const kept = Number(all?.[feedbackRef]) || 0;
        if (kept) setRating(kept);
      })
      .catch(() => {});
  }, [kv, feedbackRef]);

  async function send(stars: number, note = '') {
    setRating(stars);
    setState('sending');
    try {
      await rateRecipe(http, feedbackRef, recipe, stars, note);
      const all = (await kv.get<Record<string, number>>(STORE).catch(() => null)) ?? {};
      await kv.set(STORE, { ...all, [feedbackRef]: stars }).catch(() => {});
      setState(note ? 'sent' : 'idle');
    } catch {
      setState('failed');
    }
  }

  return (
    <View
      style={{
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
          {rating ? 'Thanks for rating it' : 'How was this recipe?'}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              testID={`recipe-star-${n}`}
              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
              accessibilityState={{ selected: rating === n }}
              disabled={state === 'sending'}
              onPress={() => void send(n)}
              style={{ padding: 4, opacity: state === 'sending' ? 0.6 : 1 }}
            >
              <FeatherStarGlyph
                size={20}
                strokeWidth={1.8}
                color={n <= rating ? GOLD : '#cbd5e1'}
                filled={n <= rating}
              />
            </Pressable>
          ))}
        </View>
      </View>
      {state === 'failed' ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: '#e11d48' }}>
          Couldn&apos;t send that. Tap a star to try again.
        </Text>
      ) : null}
      {rating > 0 && state !== 'sent' && state !== 'failed' ? (
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
          <TextInput
            testID="recipe-comment"
            value={comment}
            onChangeText={setComment}
            maxLength={1000}
            placeholder="Anything to add? (optional)"
            placeholderTextColor="#94a3b8"
            style={{
              flex: 1,
              borderRadius: 999,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.1)',
              paddingHorizontal: 14,
              paddingVertical: 8,
              fontSize: 13,
              color: '#1A1A2E',
            }}
          />
          <Pressable
            testID="recipe-comment-send"
            disabled={!comment.trim() || state === 'sending'}
            onPress={() => void send(rating, comment.trim())}
            style={{
              borderRadius: 999,
              backgroundColor: '#1F5D20',
              paddingHorizontal: 14,
              justifyContent: 'center',
              opacity: !comment.trim() || state === 'sending' ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#ffffff' }}>
              Send
            </Text>
          </Pressable>
        </View>
      ) : null}
      {state === 'sent' ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>Got it, thank you.</Text>
      ) : null}
    </View>
  );
}

/**
 * A recipe from DiVA's "use it up" flow, laid out to cook from, with a rating under it.
 * Web: components/ai/RecipeCard.tsx.
 */
export function RecipeCard({
  recipe,
  feedbackRef,
}: {
  recipe: UseUpRecipe;
  feedbackRef?: string;
}) {
  const theme = useTheme();
  return (
    <View
      testID="ai-recipe"
      style={{
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#F7F8F4',
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ flex: 1, fontSize: 16, lineHeight: 21, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
          {recipe.title}
        </Text>
        {recipe.minutes ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: 999,
              backgroundColor: '#ffffff',
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <ClockGlyph color="#1F5D20" size={14} />
            <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#1F5D20' }}>
              {recipe.minutes} min
            </Text>
          </View>
        ) : null}
      </View>

      {recipe.uses.length > 0 ? (
        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {recipe.uses.map((use) => (
            <View
              key={use}
              style={{ borderRadius: 999, backgroundColor: '#DCFE77', paddingHorizontal: 10, paddingVertical: 2 }}
            >
              <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>{use}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 12, gap: 8 }}>
        {recipe.steps.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                marginTop: 1,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: theme.font.bold, color: '#1A1A2E' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 19, color: '#1A1A2E' }}>{step}</Text>
          </View>
        ))}
      </View>

      {recipe.tip ? (
        <Text
          style={{
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 13,
            lineHeight: 18,
            color: '#475569',
            overflow: 'hidden',
          }}
        >
          <Text style={{ fontFamily: theme.font.semibold, color: '#1F5D20' }}>Tip: </Text>
          {recipe.tip}
        </Text>
      ) : null}

      {feedbackRef ? <RecipeRating recipe={recipe} feedbackRef={feedbackRef} /> : null}
    </View>
  );
}

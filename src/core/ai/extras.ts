/**
 * What a DiVA reply can carry besides its text and buttons. Mirrors web `api/aiApi.ts`
 * (DiversionGuidance, UseUpRecipe, AiImage) and aiResponse.ts's normalizeAiImages, on
 * main 964a78a.
 */

/** Outside-world advice for a "how do I get rid of X?" answer. */
export type DiversionGuidance = {
  item: string;
  summary: string;
  steps: string[];
  elsewhere: string[];
  caution: string | null;
  material: string | null;
  /** Real places near the person that take it, found on Google Maps by DiVA. */
  nearby?: { name: string; mapsUrl: string; placeId: string | null }[];
};

/** A recipe from the "use it up" flow: the tapped idea, made with the user's food. */
export type UseUpRecipe = {
  title: string;
  uses: string[];
  minutes: number | null;
  steps: string[];
  tip: string | null;
};

export type AiImage = { url: string; alt?: string; caption?: string };

const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

export function parseGuidance(raw: unknown): DiversionGuidance | undefined {
  const g = obj(raw);
  if (!g || !str(g.summary)) return undefined;
  const nearby = Array.isArray(g.nearby)
    ? g.nearby.flatMap((p) => {
        const place = obj(p);
        if (!place || !str(place.name) || !str(place.mapsUrl)) return [];
        return [
          {
            name: str(place.name),
            mapsUrl: str(place.mapsUrl),
            placeId: str(place.placeId) || null,
          },
        ];
      })
    : [];
  return {
    item: str(g.item),
    summary: str(g.summary),
    steps: strings(g.steps),
    elsewhere: strings(g.elsewhere),
    caution: str(g.caution) || null,
    material: str(g.material) || null,
    ...(nearby.length > 0 ? { nearby } : {}),
  };
}

export function parseRecipe(raw: unknown): UseUpRecipe | undefined {
  const r = obj(raw);
  if (!r || !str(r.title)) return undefined;
  return {
    title: str(r.title),
    uses: strings(r.uses),
    minutes: typeof r.minutes === 'number' ? r.minutes : null,
    steps: strings(r.steps),
    tip: str(r.tip) || null,
  };
}

/** Server images ({ url, alt, caption }) and legacy bare URL strings. */
export function normalizeAiImages(raw: unknown): AiImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): AiImage[] => {
    if (typeof item === 'string') {
      return item.trim() ? [{ url: item.trim() }] : [];
    }
    const image = obj(item);
    const url = str(image?.url).trim();
    if (!image || !url) return [];
    return [
      {
        url,
        ...(str(image.alt) ? { alt: str(image.alt) } : {}),
        ...(str(image.caption) ? { caption: str(image.caption) } : {}),
      },
    ];
  });
}

/** What the reply cost in AI tokens (`tokens.cost`), when the app is metered. */
export function parseTokenCost(envelope: unknown): number | undefined {
  const tokens = obj(obj(envelope)?.tokens);
  const cost = tokens?.cost;
  return typeof cost === 'number' && cost > 0 ? cost : undefined;
}

/**
 * The recipe as plain text, the way someone would paste it to a friend (web
 * utils/recipeShare.ts recipeShareText): what the share button sends.
 */
export function recipeShareText(recipe: UseUpRecipe): string {
  return [
    `${recipe.title}${recipe.minutes ? ` (about ${recipe.minutes} min)` : ''}`,
    recipe.uses.length > 0 ? `Uses: ${recipe.uses.join(', ')}` : '',
    '',
    ...recipe.steps.map((step, i) => `${i + 1}. ${step}`),
    recipe.tip ? `\nTip: ${recipe.tip}` : '',
    '',
    'A recipe I made with DiVA on NatCycle, from food that was about to go off.',
    'https://natcycle.app',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')
    .trim();
}

/**
 * The ideas DiVA's "use it up" flow answers with first (CLARIFICATION context
 * `useUp.ideas`), one of which is then asked for as a recipe. Web MakeRecipeSheet readIdeas.
 */
export type UseUpIdea = { title: string; uses: string[]; why: string };

export function readUseUpIdeas(context: Record<string, unknown> | undefined): UseUpIdea[] {
  const raw = (context?.useUp as { ideas?: unknown } | undefined)?.ideas;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (idea): idea is Record<string, unknown> =>
        !!idea && typeof idea === 'object' && typeof (idea as { title?: unknown }).title === 'string',
    )
    .map((idea) => ({
      title: String(idea.title),
      uses: Array.isArray(idea.uses) ? idea.uses.map(String) : [],
      why: typeof idea.why === 'string' ? idea.why : '',
    }));
}

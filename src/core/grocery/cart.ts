/**
 * A scan in progress on the ML service: the cart, its open questions, what DiVA asks out
 * loud, and how an answer is understood. Mirrors web (main 964a78a) api/groceryApi.ts
 * MlCart types and pages/dashboard/ai/GroceryManager.tsx (questionPrompt, applyAnswer).
 */
import { isAffirmative, labelFromAnswer, parseExpiryInput } from './expiry';

export type MlCartStatus = 'processing' | 'awaiting_answers' | 'ready' | 'finalized' | 'failed';
export type MlQuestionKind = 'label' | 'expiry' | 'merge' | 'review';

export type MlCartBox = { x_min: number; y_min: number; x_max: number; y_max: number };

export type MlCartItem = {
  tag: number;
  /** Every number this row covers, and how many items that is. */
  tags: number[];
  quantity: number;
  /** Set when combined into another: the list shows the group as one row. */
  merged_into: number | null;
  box: MlCartBox;
  label: string | null;
  suggested_label: string | null;
  expiry: { expires_on: string; source: string; confidence: number } | null;
};

export type MlOpenQuestion = { tag: number; kind: MlQuestionKind; hint: string | null };

export type MlCart = {
  id: string;
  status: MlCartStatus;
  image_url: string;
  items: MlCartItem[];
  open_questions: MlOpenQuestion[];
  confirmed: boolean;
  failure_reason: string | null;
  updated_at: string;
};

const STATUSES: MlCartStatus[] = ['processing', 'awaiting_answers', 'ready', 'finalized', 'failed'];
const KINDS: MlQuestionKind[] = ['label', 'expiry', 'merge', 'review'];
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);

/** A cart as the ML service sends it, read defensively. */
export function parseMlCart(raw: unknown): MlCart | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  return {
    id: r.id,
    status: STATUSES.includes(r.status as MlCartStatus) ? (r.status as MlCartStatus) : 'processing',
    image_url: typeof r.image_url === 'string' ? r.image_url : '',
    items: (Array.isArray(r.items) ? r.items : []).flatMap((x) => {
      if (!x || typeof x !== 'object') return [];
      const i = x as Record<string, unknown>;
      const box = (i.box ?? {}) as Record<string, unknown>;
      const expiry = i.expiry && typeof i.expiry === 'object' ? (i.expiry as Record<string, unknown>) : null;
      return [
        {
          tag: num(i.tag),
          tags: Array.isArray(i.tags) ? i.tags.filter((t): t is number => typeof t === 'number') : [num(i.tag)],
          quantity: num(i.quantity) || 1,
          merged_into: typeof i.merged_into === 'number' ? i.merged_into : null,
          box: { x_min: num(box.x_min), y_min: num(box.y_min), x_max: num(box.x_max), y_max: num(box.y_max) },
          label: strOrNull(i.label),
          suggested_label: strOrNull(i.suggested_label),
          expiry:
            expiry && typeof expiry.expires_on === 'string'
              ? { expires_on: expiry.expires_on, source: String(expiry.source ?? ''), confidence: num(expiry.confidence) }
              : null,
        },
      ];
    }),
    open_questions: (Array.isArray(r.open_questions) ? r.open_questions : []).flatMap((x) => {
      if (!x || typeof x !== 'object') return [];
      const q = x as Record<string, unknown>;
      if (!KINDS.includes(q.kind as MlQuestionKind)) return [];
      return [{ tag: num(q.tag), kind: q.kind as MlQuestionKind, hint: strOrNull(q.hint) }];
    }),
    confirmed: r.confirmed === true,
    failure_reason: strOrNull(r.failure_reason),
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : '',
  };
}

/** What DiVA says for a question, and a short example of how to answer it. */
export function questionPrompt(
  q: MlOpenQuestion | undefined,
  cart: MlCart | null,
): { text: string; example?: string } {
  if (!q) return { text: 'Tell me what is there' };
  if (q.kind === 'merge') {
    const group = cart?.items.find((i) => i.tag === q.tag);
    const count = group?.quantity ?? 2;
    return {
      text: `I found more than one ${q.hint ?? 'of these'}. Treat them as one?`,
      example: count > 1 ? 'Say yes to combine, or no to keep them apart' : undefined,
    };
  }
  if (q.kind === 'review') {
    return { text: 'Does this look right?', example: 'Say "yes", or "3 is milk", or "remove 9"' };
  }
  // `hint` is the item's (suggested) name, not question text.
  if (q.kind === 'label') {
    return q.hint
      ? { text: `Is number ${q.tag} ${q.hint}?`, example: 'Say "yes", or what it is' }
      : { text: `What is number ${q.tag}?`, example: 'Say the product name' };
  }
  const item = cart?.items.find((i) => i.tag === q.tag);
  const name = q.hint || item?.label || `number ${q.tag}`;
  return { text: `When does the ${name} expire?`, example: 'e.g. "15 Oct 2026" or "in 5 days"' };
}

/** What an answer means for the cart, or what to say when it wasn't understood. */
export type CartAction =
  | { type: 'confirm' }
  | { type: 'remove'; tag: number }
  | { type: 'update'; tag: number; changes: { label?: string; expires_on?: string } }
  | { type: 'merge'; tag: number }
  | { type: 'keepSeparate'; tag: number }
  | { type: 'sayAgain'; message: string };

/**
 * Understands a typed or spoken answer to the current question (web applyAnswer): "yes",
 * "3 is milk", "remove 9", yes or no to combining, a name, or a date.
 */
export function interpretAnswer(
  text: string,
  question: MlOpenQuestion | undefined,
  today = new Date(),
): CartAction {
  const trimmed = text.trim();
  if (!question || question.kind === 'review') {
    if (isAffirmative(trimmed)) return { type: 'confirm' };
    const remove = trimmed.match(/^(?:remove|delete)\s+#?(\d+)\b/i);
    if (remove) return { type: 'remove', tag: Number(remove[1]) };
    const rename = trimmed.match(/^(?:#?(\d+)\s+(?:is|are|=)\s+)(.+)$/i);
    if (rename && rename[2]) {
      return { type: 'update', tag: Number(rename[1]), changes: { label: rename[2].trim() } };
    }
    return {
      type: 'sayAgain',
      message: "Sorry, I didn't catch that. Say yes if the list is right, or for example: number 3 is milk.",
    };
  }
  if (question.kind === 'merge') {
    const yes = isAffirmative(trimmed);
    const no = /^(no|nope|nah|keep|separate|different)/i.test(trimmed);
    if (yes) return { type: 'merge', tag: question.tag };
    if (no) return { type: 'keepSeparate', tag: question.tag };
    return { type: 'sayAgain', message: 'Say yes to combine them, or no to keep them apart.' };
  }
  if (question.kind === 'label') {
    // "yes" accepts the suggested name rather than renaming the item to "yes".
    const label = labelFromAnswer(trimmed, question.hint);
    if (!label) {
      return {
        type: 'sayAgain',
        message: question.hint
          ? `Sorry, I didn't catch that. Say yes if it's ${question.hint}, or tell me what it is.`
          : "Sorry, I didn't catch that. Tell me what the item is.",
      };
    }
    return { type: 'update', tag: question.tag, changes: { label } };
  }
  const date = parseExpiryInput(trimmed, today);
  if (!date) {
    return { type: 'sayAgain', message: "Sorry, I didn't catch a date. Try the third of September, or in five days." };
  }
  return { type: 'update', tag: question.tag, changes: { expires_on: date } };
}

/** The Grocery Manager's attention pill (web attentionTitle / attentionBody). */
export function attentionCopy(glance: { state: 'loading' | 'empty' | 'calm' | 'due'; count?: number }): {
  title: string;
  body: string;
} {
  switch (glance.state) {
    case 'due':
      return {
        title: 'Attention',
        body: glance.count === 1 ? '1 of your items is expiring' : `${glance.count ?? 0} of your items are expiring`,
      };
    case 'calm':
      return { title: 'All fresh', body: 'Nothing expiring this week' };
    case 'empty':
      return { title: 'Your groceries', body: 'View your history' };
    case 'loading':
      return { title: 'Your groceries', body: 'Checking…' };
  }
}

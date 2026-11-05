import type { AiImage, DiversionGuidance, UseUpRecipe } from './extras';
import type { AiToolCall } from './tools';

export const AI_CAPABILITIES = [
  {
    id: 'recycling',
    title: 'Find recycling',
    prompt: 'Find recycling places near me',
  },
  { id: 'events', title: 'Events', prompt: 'Show me diversion events near me' },
  { id: 'impact', title: 'My impact', prompt: 'Take me to green profile' },
] as const;

export const AI_WELCOME_CHIPS = [
  {
    id: 'dropoffs',
    label: 'Find drop-offs',
    prompt: 'Find recycling places near me',
  },
  { id: 'nearby', label: 'Nearby Events', prompt: 'Show me Events near me' },
  { id: 'impact', label: 'My impact', prompt: 'Take me to green profile' },
] as const;

export const AI_FALLBACK =
  "I'm still learning that one. Try asking about drop-off locations, logging a recyclable, or your carbon impact.";

export type AiMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Raw tool calls from the service; grouped into buttons at render time. */
  tools?: AiToolCall[];
  options?: string[];
  /** CLARIFICATION context, sent back with the picked option (web `context`). */
  context?: Record<string, unknown>;
  guidance?: DiversionGuidance;
  recipe?: UseUpRecipe;
  images?: AiImage[];
  /** AI tokens this reply took, shown faintly under it. */
  tokenCost?: number;
  /** When it was said; saved, so a recipe's rating key survives a reload. */
  timestamp?: string;
  /** The question needed location and it is off: ask to turn it on, then ask again. */
  locationAsk?: { question: string; access: 'prompt' | 'denied' };
  /** DiVA couldn't answer because the member's tokens ran out. */
  outOfTokens?: boolean;
};

export function greetingName(firstName?: string): string {
  const name = firstName?.trim();
  if (!name || name.toLowerCase() === 'there') return 'there';
  return name;
}

export function aiLandingTitle(firstName?: string): string {
  return `Hi ${greetingName(firstName)}, what diversion questions do you have?`;
}

export function parseAiHref(tool?: string): string | null {
  if (!tool) return null;
  const lower = tool.toLowerCase();
  if (
    lower.includes('where') ||
    lower.includes('recycl') ||
    lower.includes('drop-off') ||
    lower.includes('dropoff')
  ) {
    return '/where';
  }
  if (lower.includes('event') || lower.includes('campaign'))
    return '/campaigns';
  if (
    lower.includes('impact') ||
    lower.includes('green profile') ||
    lower.includes('carbon')
  ) {
    return '/impact';
  }
  if (lower.includes('log') || lower.includes('record'))
    return '/dropoff/create';
  return null;
}

export function navigationFromPrompt(prompt: string): string | null {
  return parseAiHref(prompt);
}

export type AiTextLine = {
  text: string;
  /** Rendered bold with extra top spacing, per web `formatAiText`. */
  isTitle: boolean;
  /** Blank source lines keep their height (web emits ` `). */
  isBlank: boolean;
};

/**
 * Splits an assistant reply into display lines, mirroring `formatAiText` in
 * client/src/pages/dashboard/ai/AiChat.tsx:714-735.
 *
 * A line is a title when it starts "Method <n>", or ends with
 * "(default option)" / "(only if safe)". Everything else is body text. The
 * previous mobile chat rendered the whole reply as one flat string, so these
 * headings and the blank-line spacing were lost.
 */
export function formatAiLines(text: string): AiTextLine[] {
  return text.split('\n').map((line) => {
    const trimmed = line.trim();
    const isTitle =
      /^method\s*\d+/i.test(trimmed) ||
      trimmed.endsWith('(default option)') ||
      trimmed.endsWith('(only if safe)');
    return { text: line, isTitle, isBlank: line.length === 0 };
  });
}

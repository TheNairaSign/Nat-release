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
  tools?: AiTool[];
  options?: string[];
};

export type AiTool = {
  label: string;
  href: string;
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
  if (lower.includes('reward')) return '/rewards';
  if (lower.includes('log') || lower.includes('record'))
    return '/dropoff/create';
  return null;
}

export function extractAssistantReply(body: unknown): {
  text: string;
  tools: AiTool[];
  options: string[];
} {
  if (!body || typeof body !== 'object') {
    return { text: AI_FALLBACK, tools: [], options: [] };
  }
  const root = body as Record<string, unknown>;
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  const text =
    (typeof data.answer === 'string' && data.answer) ||
    (typeof data.message === 'string' && data.message) ||
    (typeof data.text === 'string' && data.text) ||
    (typeof data.response === 'string' && data.response) ||
    AI_FALLBACK;
  const tools: AiTool[] = [];
  const rawTools = Array.isArray(data.tools)
    ? data.tools
    : Array.isArray(data.actions)
      ? data.actions
      : [];
  for (const item of rawTools) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const label =
      typeof row.label === 'string'
        ? row.label
        : typeof row.title === 'string'
          ? row.title
          : typeof row.name === 'string'
            ? row.name
            : undefined;
    const action = typeof row.action === 'string' ? row.action : label;
    const href =
      (typeof row.href === 'string' && row.href) ||
      (typeof row.path === 'string' && row.path) ||
      parseAiHref(action);
    if (label && href) tools.push({ label, href });
  }
  const options = Array.isArray(data.options)
    ? data.options.filter((item): item is string => typeof item === 'string')
    : Array.isArray(data.clarifications)
      ? data.clarifications.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
  return { text, tools, options };
}

export function navigationFromPrompt(prompt: string): string | null {
  return parseAiHref(prompt);
}

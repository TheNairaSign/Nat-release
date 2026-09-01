/**
 * Port of the web AI tool pipeline:
 *   client/src/pages/dashboard/ai/aiResponse.ts  (parseAiResponse)
 *   client/src/pages/dashboard/ai/AiChat.tsx     (isThingsMatchTool,
 *                                                 getContinueLabel,
 *                                                 groupToolsIntoActions)
 *
 * The AI service answers with a discriminated union `{ type, data, metadata }`
 * and its tools are `{ name, parameters }` — NOT `{ label, href }`. The
 * previous mobile parser looked for label/href, so it never produced a single
 * tool and none of the Continue buttons ever rendered: the whole agentic flow
 * was invisible on mobile even though the text replies came through.
 */

export type AiToolCall = {
  name: string;
  parameters: Record<string, unknown>;
  description?: string;
};

export type AiAction = {
  id: string;
  label: string;
  tools: AiToolCall[];
  isTm: boolean;
};

const FALLBACK_ANSWER =
  "I'm still learning that one. Try asking about drop-off locations, logging a recyclable, or your carbon impact.";

const THINGSMATCH_FALLBACK_URL = 'https://thingsmatch.com/add-item';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function paramsOf(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function toolsFrom(raw: unknown): AiToolCall[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const name = str(row.name);
    if (!name) return [];
    return [
      {
        name,
        parameters: paramsOf(row.parameters),
        description: str(row.description) || undefined,
      },
    ];
  });
}

/** Web's `buildThingsMatchUrl` — deep-links a bare origin into /add-item. */
export function buildThingsMatchUrl(
  baseUrl: string,
  itemHint?: string,
): string {
  const url = (baseUrl || THINGSMATCH_FALLBACK_URL).trim();
  if (/[?&](name|category|description)=/i.test(url)) return url;
  if (!itemHint?.trim()) return url;
  const sep = url.includes('?') ? '&' : '?';
  const withHint = /[?&]itemHint=/i.test(url)
    ? url
    : `${url}${sep}itemHint=${encodeURIComponent(itemHint.trim())}`;
  return /[?&]source=/i.test(withHint)
    ? withHint
    : `${withHint}${withHint.includes('?') ? '&' : '?'}source=natcycle-ai`;
}

export type ParsedAiReply = {
  text: string;
  tools: AiToolCall[];
  options: string[];
};

/** Mirrors `parseAiResponse`, including each response type's tool synthesis. */
export function parseAiResponse(body: unknown): ParsedAiReply {
  if (!body || typeof body !== 'object') {
    return { text: FALLBACK_ANSWER, tools: [], options: [] };
  }
  const root = body as Record<string, unknown>;
  // Some transports wrap the envelope in `data`.
  const envelope =
    root.type === undefined && root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;

  const type = str(envelope.type).toUpperCase();
  const data = paramsOf(envelope.data);

  switch (type) {
    case 'AGENTIC':
      return {
        text: str(data.answer) || FALLBACK_ANSWER,
        tools: toolsFrom(data.tools),
        options: [],
      };
    case 'CLARIFICATION':
      return {
        text: str(data.answer) || str(data.question) || FALLBACK_ANSWER,
        tools: toolsFrom(data.tools),
        options: Array.isArray(data.options)
          ? data.options.filter((o): o is string => typeof o === 'string')
          : [],
      };
    case 'NAVIGATION':
      return {
        text: str(data.description) || 'I can take you there.',
        tools: [
          {
            name: 'navigateTo',
            parameters: { route: data.route, params: data.params },
          },
        ],
        options: [],
      };
    case 'EXTERNAL': {
      const itemHint = str(data.itemHint) || undefined;
      const title = str(data.title) || 'ThingsMatch';
      return {
        text:
          str(data.description) ||
          'ThingsMatch is the right place for that. Tap Continue to open it.',
        tools: [
          {
            name: 'openExternal',
            parameters: {
              url: buildThingsMatchUrl(
                str(data.url) || THINGSMATCH_FALLBACK_URL,
                itemHint,
              ),
              title,
              ...(itemHint ? { itemHint } : {}),
            },
            description: title,
          },
        ],
        options: [],
      };
    }
    case 'KNOWLEDGE':
    default:
      return {
        text:
          str(data.answer) ||
          str(envelope.answer) ||
          str(envelope.message) ||
          FALLBACK_ANSWER,
        tools: toolsFrom(data.tools),
        options: [],
      };
  }
}

export function isThingsMatchTool(tool: AiToolCall): boolean {
  if (tool.name === 'openExternal' || tool.name === 'openUrl') return true;
  const haystack = [
    tool.name,
    tool.description ?? '',
    str(tool.parameters.label),
    str(tool.parameters.title),
    str(tool.parameters.route),
    str(tool.parameters.url),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes('thingsmatch') || haystack.includes('things match');
}

/** Web's `getContinueLabel`, rule for rule and in the same order. */
export function continueLabel(tools: AiToolCall[]): string {
  const explicit = tools
    .map(
      (t) =>
        str(t.parameters.buttonLabel) ||
        t.description ||
        str(t.parameters.title) ||
        str(t.parameters.label),
    )
    .find(Boolean);
  if (explicit) return String(explicit);

  if (tools.some(isThingsMatchTool)) {
    const category = tools.map((t) => str(t.parameters.category)).find(Boolean);
    return category ? `ThingsMatch · ${category}` : 'ThingsMatch';
  }

  const materialFilter = tools.find(
    (t) => t.name === 'setFilter' && t.parameters.filterType === 'materialType',
  );
  if (materialFilter)
    return `${String(materialFilter.parameters.value)} nearby`;

  const withParams = tools.find((t) => t.name === 'navigateToWithParams');
  const fromParams = withParams
    ? str(paramsOf(withParams.parameters.params).materialType)
    : '';
  if (fromParams) return `${fromParams} nearby`;

  const nav = tools.find(
    (t) => t.name === 'navigateTo' || t.name === 'navigateToWithParams',
  );
  const route = str(nav?.parameters.route).toLowerCase();
  if (route.includes('campaign') || route.includes('event'))
    return 'Open Events';
  if (route.includes('green-profile') || route.includes('profile')) {
    return 'My impact';
  }
  if (route.includes('where')) return 'Find nearby';
  if (route.includes('dropoff') || route.includes('drop-off')) {
    return 'Log drop-off';
  }
  return 'Continue';
}

const FIND_WHERE_TOOLS = new Set([
  'setFilter',
  'navigateToWithParams',
  'navigateTo',
  'applyMultipleFilters',
  'performSearch',
]);

/** Web's `groupToolsIntoActions` — one Continue button per group. */
export function groupToolsIntoActions(tools: AiToolCall[]): AiAction[] {
  const groups = new Map<string, AiToolCall[]>();

  for (const tool of tools) {
    let key = str(tool.parameters.actionGroup);
    if (!key) {
      if (isThingsMatchTool(tool)) key = 'thingsmatch_post';
      else if (FIND_WHERE_TOOLS.has(tool.name)) key = 'find_where';
      else key = tool.name;
    }
    const list = groups.get(key) ?? [];
    list.push(tool);
    groups.set(key, list);
  }

  return Array.from(groups.entries()).map(([id, groupTools]) => ({
    id,
    label: continueLabel(groupTools),
    tools: groupTools,
    isTm: groupTools.some(isThingsMatchTool),
  }));
}

export type AiActionTarget =
  { kind: 'external'; url: string } | { kind: 'route'; href: string };

/**
 * What tapping one action does: open ThingsMatch externally, or navigate
 * in-app, carrying any material/location filters as query params — the
 * navigate/filter half of web's `handleToolExecution`.
 */
export function resolveActionTarget(action: AiAction): AiActionTarget | null {
  const filters: Record<string, string> = {};
  let route = '';

  for (const tool of action.tools) {
    if (tool.name === 'openExternal' || tool.name === 'openUrl') {
      const url = str(tool.parameters.url);
      if (url) {
        return {
          kind: 'external',
          url: buildThingsMatchUrl(
            url,
            str(tool.parameters.itemHint) || undefined,
          ),
        };
      }
    }

    if (
      tool.name === 'setFilter' &&
      tool.parameters.filterType === 'materialType'
    ) {
      const value = str(tool.parameters.value);
      if (value) filters.type = value;
    }

    const params = paramsOf(tool.parameters.params);
    const material = str(params.materialType) || str(params.type);
    if (material && !filters.type) filters.type = material;
    if (str(params.organization))
      filters.organization = str(params.organization);

    const candidate = str(tool.parameters.route);
    if (candidate && !route) route = candidate;
  }

  if (!route && Object.keys(filters).length > 0) route = '/where';
  if (!route) return null;

  const href = route.startsWith('/') ? route : `/${route}`;
  const query = Object.entries(filters)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return { kind: 'route', href: query ? `${href}?${query}` : href };
}

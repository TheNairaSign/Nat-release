import { parseAiResponse, type AiMessage, type AiToolCall } from '@/core/ai';
import { getEnv } from '@/shared/config/env';
import { unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export type AiSuggestion = { id: string; text: string };

export const aiSuggestionsQueryKey = ['ai', 'suggestions'] as const;
export const aiHistoryQueryKey = ['ai', 'history'] as const;

export async function fetchAiPageSuggestions(
  http: HttpClient,
): Promise<AiSuggestion[]> {
  const env = getEnv();
  const response = await http.request({
    path: `${env.aiApiUrl}/suggestions?activeOnly=true`,
    method: 'GET',
    headers: { 'x-api-key': env.aiApiKey },
    token: '',
  });
  if (response.status >= 300) return [];
  return unwrapList(response.body)
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const id =
        typeof row._id === 'string'
          ? row._id
          : typeof row.id === 'string'
            ? row.id
            : null;
      const text = typeof row.text === 'string' ? row.text : null;
      return id && text ? [{ id, text }] : [];
    })
    .slice(0, 8);
}

export async function fetchChatHistory(http: HttpClient): Promise<AiMessage[]> {
  const response = await http.request({ path: '/chat', method: 'GET' });
  if (response.status >= 300) return [];
  return unwrapList(response.body).flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const text =
      (typeof row.message === 'string' && row.message) ||
      (typeof row.text === 'string' && row.text) ||
      '';
    if (!text) return [];
    const roleRaw =
      typeof row.role === 'string'
        ? row.role
        : typeof row.sender === 'string'
          ? row.sender
          : 'assistant';
    const role =
      roleRaw === 'user' || roleRaw === 'human' ? 'user' : 'assistant';
    // Web restores tools/options from history (AiChat.tsx:263-273) so the
    // Continue buttons survive a reload. Mobile dropped them, which meant no
    // action buttons ever appeared on a restored thread.
    const tools = Array.isArray(row.tools)
      ? row.tools.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const tool = item as Record<string, unknown>;
          if (typeof tool.name !== 'string') return [];
          return [
            {
              name: tool.name,
              parameters:
                tool.parameters && typeof tool.parameters === 'object'
                  ? (tool.parameters as Record<string, unknown>)
                  : {},
              description:
                typeof tool.description === 'string'
                  ? tool.description
                  : undefined,
            },
          ];
        })
      : undefined;

    const options = Array.isArray(row.options)
      ? row.options.filter((o): o is string => typeof o === 'string')
      : undefined;

    return [
      {
        id: typeof row._id === 'string' ? row._id : `hist-${index}`,
        role,
        text,
        ...(tools && tools.length > 0 ? { tools } : {}),
        ...(options && options.length > 0 ? { options } : {}),
      },
    ];
  });
}

export async function askAi(
  http: HttpClient,
  input: {
    question: string;
    userId?: string;
    firstName?: string;
    suggestionId?: string;
    history: AiMessage[];
  },
): Promise<{
  text: string;
  tools: AiToolCall[];
  options: string[];
}> {
  const env = getEnv();
  const messages = input.history.slice(-8).map((item) => ({
    text: item.text,
    sender: item.role === 'user' ? 'user' : 'assistant',
    role: item.role,
    timestamp: new Date().toISOString(),
  }));
  const response = await http.request({
    path: `${env.aiApiUrl}/ask`,
    method: 'POST',
    headers: { 'x-api-key': env.aiApiKey },
    token: '',
    body: {
      question: input.question,
      userId: input.userId,
      messages,
      context: {
        userProfile: input.userId
          ? {
              userId: input.userId,
              firstName: input.firstName,
              name: input.firstName,
            }
          : undefined,
        isSuggestion: Boolean(input.suggestionId),
        suggestionId: input.suggestionId,
      },
    },
  });
  // The AI service answers `{ type, data, metadata }` with `{ name, parameters }`
  // tools — see core/ai/tools.ts. The old extractAssistantReply expected
  // `{ label, href }` and produced no tools at all.
  if (response.status >= 300) return parseAiResponse(null);
  return parseAiResponse(response.body);
}

/**
 * Saves one message to the user's chat history.
 *
 * The backend (`server/src/models/chatModel.js`) stores a full subdocument —
 * `{ id, text, sender, timestamp, tools, ... }` with `id`, `text` and `sender`
 * all **required**. Mobile previously posted `{ message: '<raw string>' }`,
 * which mongoose rejected outright, so nothing mobile said or received was
 * ever persisted. Web saves both sides (AiChat.tsx:538 and :610), which is why
 * only web-created history existed.
 *
 * `sender` is the backend's enum ('user' | 'ai'), not our internal role name.
 */
export async function persistChatMessage(
  http: HttpClient,
  message: AiMessage,
): Promise<void> {
  await http.request({
    path: '/chat',
    method: 'POST',
    body: {
      message: {
        id: message.id,
        text: message.text,
        sender: message.role === 'user' ? 'user' : 'ai',
        timestamp: new Date().toISOString(),
        ...(message.tools && message.tools.length > 0
          ? { tools: message.tools }
          : {}),
        ...(message.options && message.options.length > 0
          ? { options: message.options }
          : {}),
      },
    },
  });
}

export async function clearChatHistory(
  http: HttpClient,
  clearMemory: boolean,
): Promise<void> {
  const env = getEnv();
  await Promise.allSettled([
    http.request({ path: '/chat', method: 'DELETE' }),
    clearMemory
      ? http.request({
          path: `${env.aiApiUrl}/chat/clear`,
          method: 'POST',
          headers: { 'x-api-key': env.aiApiKey },
          token: '',
          body: {},
        })
      : Promise.resolve({ status: 200, body: null }),
  ]);
}

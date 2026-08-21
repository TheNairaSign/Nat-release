import { extractAssistantReply, type AiMessage } from '@/core/ai';
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
    return [
      {
        id: typeof row._id === 'string' ? row._id : `hist-${index}`,
        role,
        text,
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
  tools: { label: string; href: string }[];
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
  if (response.status >= 300) return extractAssistantReply(null);
  return extractAssistantReply(response.body);
}

export async function persistChatMessage(
  http: HttpClient,
  message: string,
): Promise<void> {
  await http.request({ path: '/chat', method: 'POST', body: { message } });
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

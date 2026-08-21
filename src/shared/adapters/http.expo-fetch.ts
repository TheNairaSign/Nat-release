import { fetch as expoFetch } from 'expo/fetch';

import { GUEST_TOKEN } from '@/core/session';
import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from '@/shared/ports/http';

function joinUrl(base: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function shouldSendBearer(token: string | null | undefined): token is string {
  return Boolean(token) && token !== GUEST_TOKEN;
}

export type HttpClientOptions = {
  getToken?: () => Promise<string | null>;
};

export function createHttpClient(
  baseUrl: string,
  options: HttpClientOptions = {},
): HttpClient {
  return {
    async request(input: HttpRequest): Promise<HttpResponse> {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...input.headers,
      };
      const isForm = input.form === true || input.body instanceof FormData;
      if (input.body !== undefined && !isForm) {
        headers['Content-Type'] = 'application/json';
      }

      const token = input.token ?? (await options.getToken?.()) ?? null;
      if (shouldSendBearer(token)) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await expoFetch(joinUrl(baseUrl, input.path), {
        method: input.method ?? 'GET',
        headers,
        body:
          input.body === undefined
            ? undefined
            : isForm
              ? (input.body as BodyInit)
              : JSON.stringify(input.body),
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      return { status: response.status, body };
    },
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequest = {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
  form?: boolean;
};

export type HttpResponse = {
  status: number;
  body: unknown;
};

export interface HttpClient {
  request(input: HttpRequest): Promise<HttpResponse>;
}

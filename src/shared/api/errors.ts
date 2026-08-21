export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? defaultHttpErrorMessage(status, body));
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

function defaultHttpErrorMessage(status: number, body: unknown): string {
  return readErrorBody(body) ?? `HTTP ${status}`;
}

export function readErrorBody(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
  }
  return null;
}

export function readHttpErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function assertOk(status: number, body: unknown): void {
  if (status < 200 || status >= 300) {
    throw new HttpError(status, body);
  }
}

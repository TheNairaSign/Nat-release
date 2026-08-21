import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('https://natcycle.app/api/health', () =>
    HttpResponse.json({ ok: true }),
  ),
  http.post('https://natcycle.app/api/auth/signin', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    return HttpResponse.json({
      token: 'msw-token',
      userId: body.email ?? 'user',
    });
  }),
];

export const server = setupServer(...handlers);

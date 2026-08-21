import { z } from 'zod';

import type { Session } from '@/core/session';

export const signInResponseSchema = z.object({
  token: z.string().min(1),
  user: z
    .object({
      _id: z.string().min(1),
    })
    .passthrough(),
});

export const sessionSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
});

export type SessionDto = z.infer<typeof sessionSchema>;

export function toSession(dto: SessionDto): Session {
  return { token: dto.token, userId: dto.userId };
}

export function sessionFromSignIn(body: unknown): Session {
  const dto = signInResponseSchema.parse(body);
  return toSession({ token: dto.token, userId: dto.user._id });
}

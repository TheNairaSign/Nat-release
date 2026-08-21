import { type RewardItem } from '@/core/rewards';
import { unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export const rewardsQueryKey = ['rewards'] as const;

function idOf(raw: Record<string, unknown>): string | null {
  const id = raw._id ?? raw.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export async function fetchRewards(http: HttpClient): Promise<RewardItem[]> {
  const [all, mine] = await Promise.allSettled([
    http.request({ path: '/reward', method: 'GET' }),
    http.request({ path: '/reward/user', method: 'GET' }),
  ]);
  const redeemed = new Set<string>();
  if (mine.status === 'fulfilled' && mine.value.status < 300) {
    for (const row of unwrapList(mine.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const raw = row as Record<string, unknown>;
      const award = raw.award;
      if (typeof award === 'string') redeemed.add(award);
      if (
        award &&
        typeof award === 'object' &&
        typeof (award as { _id?: unknown })._id === 'string'
      ) {
        redeemed.add((award as { _id: string })._id);
      }
    }
  }
  if (all.status !== 'fulfilled' || all.value.status >= 300) return [];
  return unwrapList(all.value.body).flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const raw = row as Record<string, unknown>;
    const id = idOf(raw);
    if (!id) return [];
    const image = raw.image as { url?: unknown } | undefined;
    return [
      {
        id,
        name: typeof raw.name === 'string' ? raw.name : 'Reward',
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
        pointsRequired: Number(raw.pointsRequired ?? 0) || 0,
        sponsorName:
          typeof raw.sponsorName === 'string' ? raw.sponsorName : undefined,
        imageUrl: typeof image?.url === 'string' ? image.url : undefined,
        redeemed: redeemed.has(id),
      },
    ];
  });
}

export async function redeemReward(
  http: HttpClient,
  id: string,
): Promise<{ ok: boolean; code?: string; message?: string }> {
  const response = await http.request({
    path: `/reward/${id}/redeem`,
    method: 'POST',
  });
  const body = response.body as {
    redeemCode?: string;
    data?: { redeemCode?: string };
    message?: string;
  } | null;
  if (response.status === 403) {
    return {
      ok: false,
      message: body?.message ?? 'Verify your email to redeem rewards.',
    };
  }
  if (response.status >= 300)
    return { ok: false, message: body?.message ?? 'Could not redeem reward.' };
  return { ok: true, code: body?.data?.redeemCode ?? body?.redeemCode };
}

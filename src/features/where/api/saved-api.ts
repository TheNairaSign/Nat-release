import { assertOk } from '@/shared/api';
import type { HttpClient } from '@/shared/ports/http';

/** What a member can bookmark or flag on WHERE (web savedPlaceApi / suggestedEditApi). */
export type PlaceTargetType = 'location' | 'campaign';

export type SavedPlace = {
  id: string;
  targetType: PlaceTargetType;
  targetId: string;
  targetName?: string;
  createdAt: string;
};

export const savedPlacesQueryKey = ['where', 'saved-places'] as const;

/** "location:64f…": one key per saved thing, for a Set of what's already hearted. */
export const savedKey = (targetType: PlaceTargetType, targetId: string) =>
  `${targetType}:${targetId}`;

function dataOf(body: unknown): unknown {
  return body && typeof body === 'object' && 'data' in body
    ? (body as { data: unknown }).data
    : body;
}

/** GET /saved-places: everything they've bookmarked, newest first. */
export async function fetchSavedPlaces(http: HttpClient): Promise<SavedPlace[]> {
  const response = await http.request({ path: '/saved-places' });
  assertOk(response.status, response.body);
  const rows = dataOf(response.body);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const r = row as Record<string, unknown>;
    if (r.targetType !== 'location' && r.targetType !== 'campaign') return [];
    if (typeof r.targetId !== 'string') return [];
    return [
      {
        id: typeof r._id === 'string' ? r._id : `${r.targetType}:${r.targetId}`,
        targetType: r.targetType,
        targetId: r.targetId,
        targetName: typeof r.targetName === 'string' ? r.targetName : undefined,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
      },
    ];
  });
}

/** POST /saved-places — saving twice is fine, the server keeps one. */
export async function savePlace(
  http: HttpClient,
  input: { targetType: PlaceTargetType; targetId: string; targetName?: string },
): Promise<void> {
  const response = await http.request({ path: '/saved-places', method: 'POST', body: input });
  assertOk(response.status, response.body);
}

/** DELETE /saved-places/:targetType/:targetId */
export async function unsavePlace(
  http: HttpClient,
  targetType: PlaceTargetType,
  targetId: string,
): Promise<void> {
  const response = await http.request({
    path: `/saved-places/${targetType}/${encodeURIComponent(targetId)}`,
    method: 'DELETE',
  });
  assertOk(response.status, response.body);
}

/** POST /suggested-edits — what's wrong with a location or event, for an admin to fix. */
export async function suggestEdit(
  http: HttpClient,
  input: { targetType: PlaceTargetType; targetId: string; targetName?: string; message: string },
): Promise<void> {
  const response = await http.request({ path: '/suggested-edits', method: 'POST', body: input });
  assertOk(response.status, response.body);
}

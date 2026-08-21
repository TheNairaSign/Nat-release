import { type CampaignCard } from '@/core/campaigns';
import { unwrapDataObject, unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export const campaignsQueryKey = ['campaigns'] as const;

function toCard(raw: Record<string, unknown>): CampaignCard | null {
  const id =
    (typeof raw.id === 'string' && raw.id) ||
    (typeof raw._id === 'string' && raw._id) ||
    null;
  if (!id) return null;
  const image = raw.image;
  const imageUrl =
    typeof image === 'string'
      ? image
      : image &&
          typeof image === 'object' &&
          typeof (image as { url?: unknown }).url === 'string'
        ? (image as { url: string }).url
        : undefined;
  const materials = Array.isArray(raw.materialTypes)
    ? raw.materialTypes.filter(
        (item): item is string => typeof item === 'string',
      )
    : typeof raw.material === 'string'
      ? [raw.material]
      : [];
  const locations = Array.isArray(raw.locations)
    ? raw.locations.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const loc = item as Record<string, unknown>;
        return [
          {
            name: typeof loc.name === 'string' ? loc.name : 'Location',
            address: typeof loc.address === 'string' ? loc.address : undefined,
            material:
              (typeof loc.primaryMaterialType === 'string' &&
                loc.primaryMaterialType) ||
              (typeof loc.material === 'string' && loc.material) ||
              undefined,
          },
        ];
      })
    : [];
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : 'Campaign',
    description:
      typeof raw.description === 'string' ? raw.description : undefined,
    imageUrl,
    materialType: materials[0],
    materialTypes: materials,
    progress: Number(raw.progress ?? raw.currentQuantity ?? 0) || 0,
    goal: Number(raw.goal ?? raw.targetQuantity ?? 0) || 0,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : undefined,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    isIndefinite: raw.isIndefinite === true,
    locations,
  };
}

export async function fetchCampaigns(
  http: HttpClient,
  origin?: { latitude: number; longitude: number } | null,
  materialType?: string | null,
): Promise<CampaignCard[]> {
  const nearby =
    origin &&
    (await http.request({
      path: `/campaigns/nearby?latitude=${origin.latitude}&longitude=${origin.longitude}&radius=50000${
        materialType ? `&materialType=${encodeURIComponent(materialType)}` : ''
      }`,
      method: 'GET',
    }));
  const fallback = await http.request({ path: '/campaigns', method: 'GET' });
  const source =
    nearby && nearby.status < 300
      ? nearby.body
      : fallback.status < 300
        ? fallback.body
        : [];
  return unwrapList(source).flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const card = toCard(row as Record<string, unknown>);
    return card && card.status === 'active'
      ? [card]
      : card && !card.status
        ? [card]
        : [];
  });
}

export async function fetchCampaignDetail(
  http: HttpClient,
  id: string,
): Promise<CampaignCard | null> {
  const response = await http.request({
    path: `/campaigns/${id}`,
    method: 'GET',
  });
  if (response.status >= 300) return null;
  const raw =
    unwrapDataObject(response.body) ??
    (response.body as Record<string, unknown>);
  return raw ? toCard(raw) : null;
}

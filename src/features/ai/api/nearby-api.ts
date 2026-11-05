import {
  NEARBY_MAX_KM,
  pickNearestDropoffs,
  pickNearestEvents,
  type NearbyDropoff,
  type NearbyEvent,
  type RawEvent,
  type RawLocation,
} from '@/core/ai';
import { unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

type Coords = { latitude: number; longitude: number };

const qs = (params: Record<string, string | number>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

async function list(http: HttpClient, path: string): Promise<unknown[]> {
  const response = await http.request({ path });
  if (response.status >= 300) throw new Error(`HTTP ${response.status}`);
  return unwrapList(response.body);
}

/**
 * The closest NatCycle drop-offs that take a material (web findNearestDropoffs). An
 * empty list: none within 50 km. Null: both lookups failed, so we can't say.
 */
export async function fetchNearestDropoffs(
  http: HttpClient,
  material: string,
  from: Coords,
): Promise<NearbyDropoff[] | null> {
  const [simple, regular] = await Promise.allSettled([
    list(
      http,
      `/simple-dropoff-locations/nearby?${qs({
        latitude: from.latitude,
        longitude: from.longitude,
        radius: NEARBY_MAX_KM * 1000,
        materialType: material,
        limit: 30,
      })}`,
    ),
    list(
      http,
      `/dropOff-location/nearest/location?${qs({
        latitude: from.latitude,
        longitude: from.longitude,
        itemType: material,
      })}`,
    ),
  ]);
  if (simple.status === 'rejected' && regular.status === 'rejected') return null;
  return pickNearestDropoffs(
    (simple.status === 'fulfilled' ? simple.value : []) as RawLocation[],
    (regular.status === 'fulfilled' ? regular.value : []) as RawLocation[],
    material,
    from,
  );
}

/** Upcoming events that take a material, nearest first (web findNearestEvents). */
export async function fetchNearestEvents(
  http: HttpClient,
  material: string,
  from: Coords,
): Promise<NearbyEvent[] | null> {
  try {
    const raw = await list(
      http,
      `/campaigns/map?${qs({
        materialType: material,
        latitude: from.latitude,
        longitude: from.longitude,
        radius: NEARBY_MAX_KM * 1000,
        limit: 30,
      })}`,
    );
    return pickNearestEvents(raw as RawEvent[], material, from);
  } catch {
    return null;
  }
}

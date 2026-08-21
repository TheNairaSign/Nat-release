import { unwrapDataObject } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export type ProfileUser = {
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  pointsEarned: number;
  point: number;
  carbonUnits: number;
  createdAt?: string;
  phoneNumber?: string;
  impactMeasurement?: string;
  itemsCount: Record<string, number>;
  isEmailVerified?: boolean;
};

export const profileUserQueryKey = ['profile', 'user'] as const;

function asUser(raw: Record<string, unknown> | null): ProfileUser | null {
  if (!raw) return null;
  const picture = raw.profilePicture;
  const url =
    picture &&
    typeof picture === 'object' &&
    typeof (picture as { url?: unknown }).url === 'string'
      ? (picture as { url: string }).url
      : typeof raw.profilePictureUrl === 'string'
        ? raw.profilePictureUrl
        : undefined;
  const items =
    raw.itemsCount && typeof raw.itemsCount === 'object'
      ? (raw.itemsCount as Record<string, number>)
      : {};
  return {
    firstName: typeof raw.firstName === 'string' ? raw.firstName : '',
    lastName: typeof raw.lastName === 'string' ? raw.lastName : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    profilePictureUrl: url,
    pointsEarned: Number(raw.pointsEarned ?? 0) || 0,
    point: Number(raw.point ?? 0) || 0,
    carbonUnits: Number(raw.carbonUnits ?? 0) || 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    phoneNumber:
      typeof raw.phoneNumber === 'string' ? raw.phoneNumber : undefined,
    impactMeasurement:
      typeof raw.impactMeasurement === 'string'
        ? raw.impactMeasurement
        : undefined,
    itemsCount: items,
    isEmailVerified: raw.isEmailVerified === true,
  };
}

export async function fetchProfileUser(
  http: HttpClient,
): Promise<ProfileUser | null> {
  const response = await http.request({ path: '/profile', method: 'GET' });
  if (response.status < 200 || response.status >= 300) return null;
  const body =
    response.body &&
    typeof response.body === 'object' &&
    'data' in (response.body as object)
      ? unwrapDataObject(response.body)
      : (response.body as Record<string, unknown>);
  return asUser(body);
}

export async function updateProfileUser(
  http: HttpClient,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    impactMeasurement: string;
    phoneNumber: string;
  },
): Promise<ProfileUser | null> {
  const response = await http.request({
    path: '/profile',
    method: 'PUT',
    body: input,
  });
  if (response.status < 200 || response.status >= 300) return null;
  return asUser(
    unwrapDataObject(response.body) ??
      (response.body as Record<string, unknown>),
  );
}

export async function updateProfilePhoto(
  http: HttpClient,
  image: string,
): Promise<ProfileUser | null> {
  const response = await http.request({
    path: '/profile/image',
    method: 'PUT',
    body: { image },
  });
  if (response.status < 200 || response.status >= 300) return null;
  return asUser(
    unwrapDataObject(response.body) ??
      (response.body as Record<string, unknown>),
  );
}

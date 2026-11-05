/**
 * Where the Where map has been filled in (web utils/whereCoverage.ts). Add a state's box
 * here to open it up. Boxes run a little past each border, so someone covered is never
 * told they aren't.
 */
const COVERED_AREAS = [
  { name: 'Connecticut', south: 40.98, north: 42.05, west: -73.73, east: -71.79 },
  { name: 'Massachusetts', south: 41.24, north: 42.89, west: -73.51, east: -69.93 },
];

export function isCoveredPosition({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): boolean {
  return COVERED_AREAS.some(
    (area) =>
      latitude >= area.south &&
      latitude <= area.north &&
      longitude >= area.west &&
      longitude <= area.east,
  );
}

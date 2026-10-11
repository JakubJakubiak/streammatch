const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE = 111.32;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Rounds to 2 decimals (~1 km) so exact positions are never stored. */
export function coarsen(value: number) {
  return Math.round(value * 100) / 100;
}

const wrapLng = (cell: number) => ((((cell + 180) % 360) + 360) % 360) - 180;

export function cellOf(lat: number, lng: number) {
  return `${Math.floor(lat)}:${wrapLng(Math.floor(lng))}`;
}

/** All 1° grid cells that intersect a circle around the given point. */
export function cellsWithin(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / KM_PER_DEGREE;
  const cosLat = Math.max(Math.cos(toRad(lat)), 0.01);
  const dLng = Math.min(radiusKm / (KM_PER_DEGREE * cosLat), 180);
  const cells = new Set<string>();
  const minLat = Math.max(Math.floor(lat - dLat), -90);
  const maxLat = Math.min(Math.floor(lat + dLat), 89);
  for (let la = minLat; la <= maxLat; la++) {
    for (let lo = Math.floor(lng - dLng); lo <= Math.floor(lng + dLng); lo++) {
      cells.add(`${la}:${wrapLng(lo)}`);
    }
  }
  return [...cells];
}

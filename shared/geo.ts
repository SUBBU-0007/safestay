import { DangerZone, SafePlace } from './types.js';

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Ray-casting algorithm to determine if a [lat, lng] is inside a polygon [[lat, lng], ...].
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a point is within a circular radius (km).
 */
export function isPointInCircle(
  point: [number, number],
  center: [number, number],
  radiusKm: number
): boolean {
  return haversineDistance(point[0], point[1], center[0], center[1]) <= radiusKm;
}

/**
 * Checks if a point is inside a DangerZone (supports either polygon coordinates or circle).
 */
export function isPointInDangerZone(
  point: [number, number],
  zone: DangerZone
): boolean {
  if (!zone.isActive) return false;

  if (zone.coordinates && zone.coordinates.length >= 3) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return true;
    }
  }

  if (zone.center && zone.radiusKm && zone.radiusKm > 0) {
    if (isPointInCircle(point, zone.center, zone.radiusKm)) {
      return true;
    }
  }

  return false;
}

/**
 * Tests whether two 2D line segments intersect.
 */
function doSegmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  q1: [number, number],
  q2: [number, number]
): boolean {
  function ccw(a: [number, number], b: [number, number], c: [number, number]) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) &&
    ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
}

/**
 * Checks if a polyline (e.g. route coordinates) intersects any active danger zone.
 */
export function doesRouteCrossDangerZones(
  routePoints: [number, number][],
  zones: DangerZone[]
): { crosses: boolean; crossedZone?: DangerZone } {
  const activeZones = zones.filter((z) => z.isActive);
  if (activeZones.length === 0 || !routePoints || routePoints.length < 2) {
    return { crosses: false };
  }

  // 1. Check if any waypoint on the route is inside a zone
  for (const pt of routePoints) {
    for (const zone of activeZones) {
      if (isPointInDangerZone(pt, zone)) {
        return { crosses: true, crossedZone: zone };
      }
    }
  }

  // 2. Check if any line segment crosses the perimeter of the zone polygon
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i + 1];

    for (const zone of activeZones) {
      if (zone.coordinates && zone.coordinates.length >= 3) {
        for (let j = 0; j < zone.coordinates.length; j++) {
          const q1 = zone.coordinates[j];
          const q2 = zone.coordinates[(j + 1) % zone.coordinates.length];
          if (doSegmentsIntersect(p1, p2, q1, q2)) {
            return { crosses: true, crossedZone: zone };
          }
        }
      }
    }
  }

  return { crosses: false };
}

/**
 * Finds the nearest safe place for a given location using Haversine distance.
 */
export function findNearestSafePlace(
  lat: number,
  lng: number,
  places: SafePlace[]
): { safePlace: SafePlace; distanceKm: number } | null {
  if (!places || places.length === 0) return null;

  let nearest: SafePlace | null = null;
  let minDistance = Infinity;

  for (const place of places) {
    const dist = haversineDistance(lat, lng, place.lat, place.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = place;
    }
  }

  return nearest ? { safePlace: nearest, distanceKm: minDistance } : null;
}

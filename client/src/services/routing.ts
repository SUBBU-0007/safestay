import { DangerZone, SafePlace } from '../../../shared/types.js';
import { doesRouteCrossDangerZones, isPointInDangerZone, findNearestSafePlace } from '../../../shared/geo.js';

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  durationMin: number;
  isSafe: boolean;
  destinationInsideDanger: boolean;
  crossedZone?: DangerZone;
  alternateRoute?: RouteResult;
  recommendedSafePlace?: SafePlace;
  isStraightLineFallback: boolean;
}

/**
 * Computes walking/driving route via public OSRM demo server, falling back to straight-line interpolation.
 */
export async function computeRoute(
  start: [number, number],
  end: [number, number],
  activeZones: DangerZone[],
  safePlaces: SafePlace[]
): Promise<RouteResult> {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  let coordinates: [number, number][] = [];
  let distanceKm = 0;
  let durationMin = 0;
  let isFallback = false;

  try {
    // Public OSRM routing endpoint (lng,lat order for OSRM URL)
    const url = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    
    // Add 4-second timeout to avoid long hangs on network issues
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // GeoJSON coordinates are [lng, lat], convert to [lat, lng] for Leaflet
        coordinates = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        durationMin = Math.round(route.duration / 60);
      }
    }
  } catch (err) {
    console.warn('[Routing] OSRM public server failed or timed out, using straight-line route fallback:', err);
  }

  // Straight-line fallback if OSRM failed
  if (coordinates.length === 0) {
    isFallback = true;
    coordinates = generateStraightLinePoints(start, end, 20);
    const rad = Math.PI / 180;
    const dLat = (endLat - startLat) * rad;
    const dLon = (endLng - startLng) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLat * rad) * Math.cos(endLat * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    durationMin = Math.round((distanceKm / 4) * 60); // 4 km/h walking speed
  }

  // 1. Check if destination point is inside danger zone
  const destInDanger = activeZones.some((z) => isPointInDangerZone(end, z));

  // 2. Check if route crosses danger zones
  const { crosses, crossedZone } = doesRouteCrossDangerZones(coordinates, activeZones);
  const isSafe = !destInDanger && !crosses;

  let alternateRoute: RouteResult | undefined;
  let recommendedSafePlace: SafePlace | undefined;

  // 3. If unsafe, compute detour or route to nearest safe shelter!
  if (!isSafe) {
    const nearest = findNearestSafePlace(startLat, startLng, safePlaces);
    if (nearest) {
      recommendedSafePlace = nearest.safePlace;
      try {
        const detour = await computeRoute(start, [recommendedSafePlace.lat, recommendedSafePlace.lng], activeZones, []);
        alternateRoute = detour;
      } catch (err) {
        console.error('[Routing] Detour computation failed:', err);
      }
    }
  }

  return {
    coordinates,
    distanceKm,
    durationMin,
    isSafe,
    destinationInsideDanger: destInDanger,
    crossedZone,
    alternateRoute,
    recommendedSafePlace,
    isStraightLineFallback: isFallback
  };
}

/**
 * Generates N interpolated points along a straight line.
 */
function generateStraightLinePoints(
  p1: [number, number],
  p2: [number, number],
  steps: number = 20
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = p1[0] + (p2[0] - p1[0]) * t;
    const lng = p1[1] + (p2[1] - p1[1]) * t;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Search locations via Nominatim OpenStreetMap Geocoder with rate limiting and timeout.
 */
export async function geocodeSearch(query: string): Promise<Array<{ name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=4`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch (err) {
    console.warn('[Geocoding] Nominatim lookup error:', err);
  }

  return [];
}

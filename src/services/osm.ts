/**
 * Darmowe usługi oparte o OpenStreetMap (bez klucza API):
 * - Geokodowanie: Photon (Komoot) — dane OSM
 * - Routing: publiczny OSRM
 * - Kafelki: tile.openstreetmap.org (wymaga atrybucji © OpenStreetMap)
 *
 * Respektuj limity publicznych serwerów — nie używaj ich do masowego
 * komercyjnego obciążenia; w razie potrzeby ustaw własny routingServerUrl.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

export interface RouteResult {
  distanceKm: string;
  durationMin: number;
  coordinates: Array<[number, number]>; // [lat, lon]
  provider: "osrm" | "manual";
  attribution: string;
}

const APP_UA = "DelegacjePP/0.1 (Pro-PLUS SA; https://pro-plus.pl; biuro@pro-plus.pl)";

export async function geocodePlace(query: string, countryCode = "pl"): Promise<GeoPoint[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "default");
  url.searchParams.set("limit", "5");
  // Bias wyników na Polskę (bbox) — publiczny Photon nie wymaga klucza
  if (countryCode?.toLowerCase() === "pl") {
    url.searchParams.set("bbox", "14.0,49.0,24.2,54.9");
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Geokodowanie OSM (Photon) niedostępne (${res.status}). Wpisz dystans ręcznie.`);
  }
  const data = (await res.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number] };
      properties: { name?: string; city?: string; street?: string; country?: string; state?: string };
    }>;
  };
  return (data.features ?? []).map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties;
    const label = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(", ");
    return { lat, lon, label: label || q };
  });
}

export async function routeDriving(
  points: GeoPoint[],
  routingServerUrl?: string | null,
): Promise<RouteResult> {
  if (points.length < 2) {
    throw new Error("Potrzeba co najmniej punktu startu i celu.");
  }
  const base = (routingServerUrl?.trim() || "https://router.project-osrm.org").replace(/\/$/, "");
  const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `${base}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      // OSRM public — identyfikacja aplikacji (dobra praktyka)
      "User-Agent": APP_UA,
    },
  });
  if (!res.ok) {
    throw new Error(
      `Routing OSRM niedostępny (${res.status}). Sprawdź internet lub użyj trybu ręcznego / własnego serwera.`,
    );
  }
  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: Array<[number, number]> };
    }>;
  };
  const route = data.routes?.[0];
  if (!route) throw new Error("Brak trasy dla podanych punktów.");

  const km = (route.distance / 1000).toFixed(1);
  const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
  return {
    distanceKm: km,
    durationMin: Math.round(route.duration / 60),
    coordinates,
    provider: "osrm",
    attribution: "© OpenStreetMap contributors · OSRM · Photon",
  };
}

export async function planRouteFromPlaces(
  places: string[],
  routingServerUrl?: string | null,
): Promise<{ points: GeoPoint[]; route: RouteResult }> {
  const points: GeoPoint[] = [];
  for (const place of places) {
    const found = await geocodePlace(place);
    if (!found[0]) throw new Error(`Nie znaleziono lokalizacji: ${place}`);
    points.push(found[0]);
    // delikatne tempo wobec publicznych API
    await new Promise((r) => setTimeout(r, 200));
  }
  const route = await routeDriving(points, routingServerUrl);
  return { points, route };
}

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_ATTRIBUTION, OSM_TILE_URL, type GeoPoint } from "../services/osm";

interface RouteMapProps {
  points: GeoPoint[];
  coordinates: Array<[number, number]>;
  className?: string;
}

export function RouteMap({ points, coordinates, className }: RouteMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { zoomControl: true, attributionControl: true });
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const latLngs = coordinates.map(([lat, lon]) => L.latLng(lat, lon));
    if (latLngs.length) {
      const line = L.polyline(latLngs, { color: "#0078c0", weight: 5, opacity: 0.9 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [28, 28] });
    } else if (points.length) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
      map.fitBounds(bounds.pad(0.2));
    } else {
      map.setView([52.2297, 21.0122], 6);
    }

    points.forEach((p, i) => {
      L.circleMarker([p.lat, p.lon], {
        radius: 7,
        color: "#0a2a4a",
        fillColor: i === 0 ? "#b0b8b0" : "#0078c0",
        fillOpacity: 1,
        weight: 2,
      })
        .bindPopup(p.label)
        .addTo(map);
    });

    const t = window.setTimeout(() => map.invalidateSize(), 50);
    return () => window.clearTimeout(t);
  }, [points, coordinates]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={className}>
      <div ref={ref} className="h-64 w-full overflow-hidden rounded-md border border-[var(--color-border)]" />
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        Mapa pomocnicza (OpenStreetMap). Adresy i trasa są przekazywane do publicznych serwisów OSM/Photon/OSRM.
      </p>
    </div>
  );
}

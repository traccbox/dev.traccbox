import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripRoutePoint, TripStop } from "@/api/travels/types";

interface Props {
  route: TripRoutePoint[];
  /** stop markers from GET /travel/trips/{id}/stops */
  stops?: TripStop[];
  /** index of the playback marker; -1 hides it */
  playbackIndex?: number;
  height?: number;
}

const NO_STOPS: TripStop[] = []; // stable ref so the layer effect doesn't re-run

const icon = (color: string, label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;font-size:10px;font-weight:600;padding:3px 6px;border-radius:9999px;box-shadow:0 2px 6px rgba(0,0,0,.25);white-space:nowrap">${label}</div>`,
    iconSize: [1, 1],
  });

const RouteMap: React.FC<Props> = ({
  route,
  stops = NO_STOPS,
  playbackIndex = -1,
  height = 380,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const playRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !route.length) return;
    layer.clearLayers();

    const latlngs = route.map((p) => [p.lat, p.lng] as [number, number]);
    L.polyline(latlngs, { color: "#1658E5", weight: 4, opacity: 0.85 }).addTo(layer);

    route.forEach((p, i) => {
      const last = route.length - 1;
      if (i === 0)
        L.marker([p.lat, p.lng], { icon: icon("#16A34A", `Start ${p.time}`) }).addTo(layer);
      else if (i === last)
        L.marker([p.lat, p.lng], { icon: icon("#E11D48", `End ${p.time}`) }).addTo(layer);
      else
        L.circleMarker([p.lat, p.lng], {
          radius: 4,
          color: "#1658E5",
          fillColor: "#fff",
          fillOpacity: 1,
        })
          .bindTooltip(
            `${p.time} • ${p.speed_kmh ?? 0} km/h • ±${Math.round(p.accuracy_m ?? 0)} m`,
          )
          .addTo(layer);
    });

    stops.forEach((st, i) => {
      const dur =
        st.duration_minutes != null ? ` • ${Math.round(st.duration_minutes)} min` : "";
      L.marker([st.lat, st.lng], {
        icon: icon("#F59E0B", `${st.label || `Stop ${i + 1}`}${dur}`),
      }).addTo(layer);
    });

    map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
    setTimeout(() => map.invalidateSize(), 120);
  }, [route, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (playRef.current) {
      map.removeLayer(playRef.current);
      playRef.current = null;
    }
    const p = route[playbackIndex];
    if (playbackIndex >= 0 && p) {
      playRef.current = L.marker([p.lat, p.lng], {
        icon: icon("#111827", `🚗 ${p.time}`),
      }).addTo(map);
      map.panTo([p.lat, p.lng]);
    }
  }, [playbackIndex, route]);

  return <div ref={ref} style={{ height }} className="w-full rounded-xl overflow-hidden" />;
};

export default RouteMap;

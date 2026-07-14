import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WorkArea, BoundaryShape } from "./types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TYPE_COLOR: Record<string, string> = {
  office: "#1658E5",
  branch: "#1658E5",
  sales_territory: "#8B5CF6",
  warehouse: "#F59E0B",
  service_zone: "#10B981",
  delivery_zone: "#EC4899",
  client_location: "#06B6D4",
  construction_site: "#EF4444",
  market: "#14B8A6",
  custom: "#6366F1",
};

interface Props {
  areas: WorkArea[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: string | number;
  satellite?: boolean;
  interactiveDraw?: {
    shape: BoundaryShape | null;
    onChange: (s: BoundaryShape) => void;
    mode: "circle" | "polygon";
    radius?: number;
  };
  centerOverride?: [number, number];
  zoomOverride?: number;
}

export default function WorkAreaMap({
  areas,
  selectedId,
  onSelect,
  height = 500,
  satellite = false,
  interactiveDraw,
  centerOverride,
  zoomOverride,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const tileRef = useRef<L.TileLayer | null>(null);
  const drawLayerRef = useRef<L.Layer | null>(null);
  const polyPointsRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      centerOverride || [6.5244, 3.3792],
      zoomOverride || 11,
    );
    mapRef.current = map;
    tileRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap", maxZoom: 19 },
    ).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // swap tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileRef.current) return;
    map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap", maxZoom: 19 },
    ).addTo(map);
  }, [satellite]);

  // render areas
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    areas.forEach((a) => {
      const color = TYPE_COLOR[a.type] || "#1658E5";
      const isSelected = a.id === selectedId;
      const weight = isSelected ? 3 : 1.5;
      const fillOpacity = isSelected ? 0.35 : 0.15;

      let layer: L.Layer | null = null;
      if (a.boundary.kind === "circle") {
        layer = L.circle(a.boundary.center, {
          radius: a.boundary.radius,
          color,
          weight,
          fillColor: color,
          fillOpacity,
        });
      } else {
        layer = L.polygon(a.boundary.points, {
          color,
          weight,
          fillColor: color,
          fillOpacity,
        });
      }
      if (layer) {
        (layer as any).bindTooltip(a.name, { direction: "top" });
        (layer as any).on("click", () => onSelect?.(a.id));
        layer.addTo(map);
        layersRef.current.push(layer);
      }
    });

    if (selectedId) {
      const sel = areas.find((a) => a.id === selectedId);
      if (sel) {
        if (sel.boundary.kind === "circle") {
          map.setView(sel.boundary.center, 14);
        } else if (sel.boundary.points.length) {
          map.fitBounds(sel.boundary.points as any);
        }
      }
    }
  }, [areas, selectedId, onSelect]);

  // interactive draw
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !interactiveDraw) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (interactiveDraw.mode === "circle") {
        interactiveDraw.onChange({
          kind: "circle",
          center: [e.latlng.lat, e.latlng.lng],
          radius: interactiveDraw.radius || 200,
        });
      } else {
        polyPointsRef.current = [...polyPointsRef.current, [e.latlng.lat, e.latlng.lng]];
        interactiveDraw.onChange({ kind: "polygon", points: polyPointsRef.current });
      }
    };
    map.on("click", clickHandler);
    return () => {
      map.off("click", clickHandler);
    };
  }, [interactiveDraw]);

  // render current draw shape
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !interactiveDraw) return;
    if (drawLayerRef.current) {
      map.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }
    const shape = interactiveDraw.shape;
    if (!shape) return;
    if (shape.kind === "circle") {
      drawLayerRef.current = L.circle(shape.center, {
        radius: shape.radius,
        color: "#1658E5",
        fillColor: "#1658E5",
        fillOpacity: 0.25,
      }).addTo(map);
    } else if (shape.points.length) {
      drawLayerRef.current = L.polygon(shape.points, {
        color: "#1658E5",
        fillColor: "#1658E5",
        fillOpacity: 0.25,
      }).addTo(map);
    }
  }, [interactiveDraw?.shape, interactiveDraw?.radius]);

  // reset poly ref when shape cleared
  useEffect(() => {
    if (!interactiveDraw?.shape) polyPointsRef.current = [];
  }, [interactiveDraw?.shape]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerOverride) return;
    map.setView(centerOverride, zoomOverride || map.getZoom());
  }, [centerOverride, zoomOverride]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
    />
  );
}

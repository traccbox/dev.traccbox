import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BoundaryShape } from "./types";
import { WorkAreaBoundary } from "@/api/geoFencing/typesGeoFencing";

/** Minimal shape the map needs — works for both list items and drafts. */
export interface MapArea {
  id: string;
  name: string;
  type?: string;
  boundary?: WorkAreaBoundary | null;
  locations?: { name: string; boundary?: WorkAreaBoundary | null }[];
}

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
  areas: MapArea[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: string | number;
  satellite?: boolean;

  interactiveDraw?: {
    shape: BoundaryShape | null;
    onChange: (shape: BoundaryShape) => void;
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

  /**
   * Keep the latest interactiveDraw values here.
   *
   * This allows us to register the Leaflet click
   * listener only once instead of every render.
   */
  const interactiveDrawRef = useRef(interactiveDraw);

  useEffect(() => {
    interactiveDrawRef.current = interactiveDraw;
  }, [interactiveDraw]);

  /**
   * Create map
   */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
    }).setView(centerOverride || [6.5244, 3.3792], zoomOverride || 13);

    mapRef.current = map;

    tileRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      },
    ).addTo(map);

    /**
     * The map can sometimes be inside a modal/drawer
     * whose size isn't available immediately.
     */
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        map.invalidateSize();
      }
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        map.invalidateSize();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeout);
      resizeObserver.disconnect();

      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }

      tileRef.current = null;
      drawLayerRef.current = null;
      layersRef.current = [];
    };

    // Map should only be created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Change tile layer
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }

    tileRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      },
    ).addTo(map);
  }, [satellite]);

  /**
   * Render saved work areas
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    // Remove previously rendered areas
    layersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    layersRef.current = [];

    areas.forEach((area) => {
      const color = TYPE_COLOR[area.type ?? ""] || "#1658E5";

      const isSelected = area.id === selectedId;

      const weight = isSelected ? 3 : 1.5;

      const fillOpacity = isSelected ? 0.35 : 0.15;

      /**
       * An area can contain multiple locations.
       */
      const shapes: {
        label: string;
        boundary: BoundaryShape;
      }[] = area.locations?.length
        ? area.locations.map((location) => ({
            label: `${area.name} — ${location.name}`,
            boundary: location.boundary,
          }))
        : area.boundary
          ? [
              {
                label: area.name,
                boundary: area.boundary,
              },
            ]
          : [];

      shapes.forEach(({ label, boundary }) => {
        if (boundary.kind === "circle") {
          const layer = L.circle(boundary.center, {
            radius: boundary.radius,
            color,
            weight,
            fillColor: color,
            fillOpacity,
          });
          layer.bindTooltip(label, { direction: "top" });
          layer.on("click", () => { onSelect?.(area.id); });
          layer.addTo(map);
          layersRef.current.push(layer);
        }

        if (boundary.kind === "polygon" && boundary.points && boundary.points.length > 0) {
          const layer = L.polygon(boundary.points, {
            color,
            weight,
            fillColor: color,
            fillOpacity,
          });
          layer.bindTooltip(label, { direction: "top" });
          layer.on("click", () => { onSelect?.(area.id); });
          layer.addTo(map);
          layersRef.current.push(layer);
        }

        if (boundary.kind === "multipolygon" && boundary.rings && boundary.rings.length > 0) {
          boundary.rings.forEach((ring, ringIdx) => {
            if (!ring || ring.length < 3) return;
            const layer = L.polygon(ring, {
              color,
              weight,
              fillColor: color,
              fillOpacity,
            });
            layer.bindTooltip(ringIdx === 0 ? label : `${label} (part ${ringIdx + 1})`, { direction: "top" });
            layer.on("click", () => { onSelect?.(area.id); });
            layer.addTo(map);
            layersRef.current.push(layer);
          });
        }
      });
    });

    /**
     * Fit selected area into view.
     */
    if (selectedId) {
      const selectedArea = areas.find((area) => area.id === selectedId);

      if (selectedArea) {
        const bounds = L.latLngBounds([]);

        const boundaries = selectedArea.locations?.length
          ? selectedArea.locations.map((location) => location.boundary)
          : selectedArea.boundary
            ? [selectedArea.boundary]
            : [];

        boundaries.forEach((boundary) => {
          if (boundary.kind === "circle") {
            const lat = boundary.center[0];
            const lng = boundary.center[1];
            const radius = boundary.radius;

            const latOffset = radius / 111111;
            const lngOffset = radius / (111111 * Math.cos((lat * Math.PI) / 180));

            bounds.extend([lat - latOffset, lng - lngOffset]);
            bounds.extend([lat + latOffset, lng + lngOffset]);
          }

          if (boundary.kind === "polygon" && boundary.points?.length) {
            boundary.points.forEach((point) => {
              bounds.extend(point);
            });
          }

          if (boundary.kind === "multipolygon" && boundary.rings?.length) {
            boundary.rings.forEach((ring) => {
              ring.forEach((point) => bounds.extend(point));
            });
          }
        });

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 16,
          });
        }
      }
    }

    map.invalidateSize();
  }, [areas, selectedId, onSelect]);

  /**
   * Leaflet map click listener.
   *
   * IMPORTANT:
   * This listener is registered ONCE.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const clickHandler = (event: L.LeafletMouseEvent) => {
      const draw = interactiveDrawRef.current;

      if (!draw) {
        return;
      }

      /**
       * Make sure the Leaflet event actually contains
       * a valid LatLng.
       */
      if (!event.latlng) {
        return;
      }

      const { lat, lng } = event.latlng;

      /**
       * CIRCLE
       */
      if (draw.mode === "circle") {
        const radius = draw.radius || 200;

        const newShape: BoundaryShape = {
          kind: "circle",
          center: [lat, lng],
          radius,
        };

        draw.onChange(newShape);

        return;
      }

      /**
       * POLYGON
       */
      if (draw.mode === "polygon") {
        polyPointsRef.current = [...polyPointsRef.current, [lat, lng]];

        const newShape: BoundaryShape = {
          kind: "polygon",
          points: [...polyPointsRef.current],
        };

        draw.onChange(newShape);
      }
    };

    map.on("click", clickHandler);

    return () => {
      map.off("click", clickHandler);
    };
  }, []);

  /**
   * Reset polygon points when switching mode
   */
  useEffect(() => {
    polyPointsRef.current = [];

    /**
     * If we switched to circle mode, make sure
     * old polygon points don't remain.
     */
  }, [interactiveDraw?.mode]);

  /**
   * Render current drawing
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    /**
     * Remove previous drawing
     */
    if (drawLayerRef.current) {
      if (map.hasLayer(drawLayerRef.current)) {
        map.removeLayer(drawLayerRef.current);
      }

      drawLayerRef.current = null;
    }

    const shape = interactiveDraw?.shape;

    if (!shape) {
      return;
    }

    /**
     * Circle
     */
    if (shape.kind === "circle") {
      drawLayerRef.current = L.circle(shape.center, {
        radius: shape.radius,
        color: "#1658E5",
        fillColor: "#1658E5",
        fillOpacity: 0.25,
      }).addTo(map);

      return;
    }

    /**
     * Polygon
     */
    if (shape.kind === "polygon" && shape.points && shape.points.length > 0) {
      drawLayerRef.current = L.polygon(shape.points, {
        color: "#1658E5",
        fillColor: "#1658E5",
        fillOpacity: 0.25,
      }).addTo(map);
    }
  }, [interactiveDraw?.shape]);

  /**
   * Update map center
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !centerOverride) {
      return;
    }

    map.setView(centerOverride, zoomOverride || map.getZoom());
  }, [centerOverride, zoomOverride]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
}

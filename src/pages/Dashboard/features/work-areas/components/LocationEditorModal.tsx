import { useMemo, useState } from "react";
import { Circle, Hexagon, Loader2, X } from "lucide-react";
import WorkAreaMap, { MapArea } from "../WorkAreaMap";
import GeoCascade, { GeoSelection } from "./GeoCascade";
import MapSearchBox from "./MapSearchBox";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlaceSuggestions, usePlaceCoordinates } from "@/api/geoFencing/hooksGeoFencing";
import {
  WorkAreaBoundary,
  WorkAreaLocationResponse,
} from "@/api/geoFencing/typesGeoFencing";

interface Props {
  open: boolean;
  location?: WorkAreaLocationResponse | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    method: "draw" | "admin" | "manual";
    boundary: WorkAreaBoundary;
    address?: string;
    country?: string;
    state?: string;
    lga?: string;
    ward?: string;
    community?: string;
  }) => void;
}

export default function LocationEditorModal({
  open,
  location,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(location?.name ?? "");
  const [method, setMethod] = useState<"draw" | "admin" | "manual">(
    (location?.method as "draw" | "admin" | "manual") ?? "draw",
  );
  const [drawMode, setDrawMode] = useState<"circle" | "polygon">(
    location?.boundary?.kind === "polygon" ? "polygon" : "circle",
  );
  const [radius, setRadius] = useState(
    location?.boundary?.kind === "circle" ? location.boundary.radius : 200,
  );
  const [shape, setShape] = useState<WorkAreaBoundary | null>(
    location?.boundary ?? null,
  );
  const [address, setAddress] = useState(location?.address ?? "");
  const [lat, setLat] = useState(
    location?.boundary?.kind === "circle"
      ? String(location.boundary.center[0])
      : "",
  );
  const [lng, setLng] = useState(
    location?.boundary?.kind === "circle"
      ? String(location.boundary.center[1])
      : "",
  );
  const [geo, setGeo] = useState<GeoSelection>({});
  const [touched, setTouched] = useState(false);

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debouncedName = useDebounce(name, 400);
  const { data: suggestionRes, isFetching: suggestionsFetching } = usePlaceSuggestions(
    debouncedName,
    suggestionsOpen && debouncedName.trim().length > 1
  );
  const nameSuggestions = suggestionRes?.suggestions || [];
  const resolveCoords = usePlaceCoordinates();

  const interactiveDraw = useMemo(
    () => ({ shape, onChange: setShape, mode: drawMode, radius }),
    [shape, drawMode, radius],
  );

  if (!open) return null;

  const boundary = (): WorkAreaBoundary | null => {
    if (method === "manual") {
      if (!lat || !lng) return null;
      const la = parseFloat(lat);
      const ln = parseFloat(lng);
      if (Number.isNaN(la) || Number.isNaN(ln)) return null;
      return { kind: "circle", center: [la, ln], radius: radius || 200 };
    }
    if (method === "admin") {
      if (!geo.center) return null;
      return { kind: "circle", center: geo.center, radius: radius || 1000 };
    }
    if (shape?.kind === "polygon" && shape.points.length < 3) return null;
    return shape;
  };

  const validationError = (() => {
    if (!name.trim()) return "Location name is required.";
    if (method === "manual" && !boundary())
      return "Enter valid latitude and longitude.";
    if (method === "admin" && !geo.lgaId)
      return "Select at least country, state and LGA.";
    if (method === "admin" && !geo.center)
      return "The selected area has no coordinates. Use draw or manual entry.";
    if (method === "draw" && !boundary())
      return drawMode === "circle"
        ? "Click the map to place the circle centre."
        : "Place at least 3 polygon points.";
    return null;
  })();

  const previewAreas: MapArea[] = boundary()
    ? [{ id: "draft", name: name || "Location", boundary: boundary() }]
    : [];

  const submit = () => {
    setTouched(true);
    const b = boundary();
    if (validationError || !b) return;
    onSave({
      name: name.trim(),
      method,
      boundary: b,
      address: address.trim() || undefined,
      country: geo.countryName || undefined,
      state: geo.stateName || undefined,
      lga: geo.lgaName || undefined,
      ward: geo.wardName || undefined,
      community: geo.communityName || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {location ? "Edit Location" : "Add Location"}
            </h2>
            <p className="text-xs text-gray-500">
              Define the geofence boundary for this location
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1.5">
                Location Name *
              </label>
              <div className="relative">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestionsOpen(false), 250)}
                  placeholder="e.g. Ikeja HQ"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
                {(suggestionsFetching || resolveCoords.isPending) && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {suggestionsOpen && nameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-[500] mt-1 bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {nameSuggestions.map((r, i) => (
                    <button
                      key={`${r.place_id}-${i}`}
                      type="button"
                      disabled={resolveCoords.isPending}
                      onClick={() => {
                        resolveCoords.mutate(r.place_id, {
                          onSuccess: (coords) => {
                            setName(r.description);
                            setSuggestionsOpen(false);
                            setLat(coords.latitude.toString());
                            setLng(coords.longitude.toString());
                            setShape({
                              kind: "circle",
                              center: [coords.latitude, coords.longitude],
                              radius,
                            });
                          },
                        });
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b last:border-b-0 text-gray-800 disabled:opacity-50"
                    >
                      {r.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="12 Alausa Way"
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50 w-fit">
            {(["draw", "admin", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                  method === m ? "bg-white shadow text-[#1658E5]" : "text-gray-600"
                }`}
              >
                {m === "admin" ? "Administrative" : m}
              </button>
            ))}
          </div>

          {method === "admin" && (
            <GeoCascade value={geo} onChange={setGeo} />
          )}

          {method === "manual" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Latitude *
                </label>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="6.6018"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Longitude *
                </label>
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="3.3515"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {method === "draw" && (
            <>
              <MapSearchBox
                onPick={({ lat: la, lng: ln }) => {
                  setDrawMode("circle");
                  setShape({ kind: "circle", center: [la, ln], radius });
                }}
                placeholder="Search a place to centre the map…"
              />
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50 w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("circle");
                    setShape(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
                    drawMode === "circle"
                      ? "bg-white shadow text-[#1658E5]"
                      : "text-gray-600"
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" /> Circle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("polygon");
                    setShape(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
                    drawMode === "polygon"
                      ? "bg-white shadow text-[#1658E5]"
                      : "text-gray-600"
                  }`}
                >
                  <Hexagon className="w-3.5 h-3.5" /> Polygon
                </button>
              </div>
            </>
          )}

          {(method !== "draw" || drawMode === "circle") && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Radius:</span>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={radius}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  setRadius(r);
                  if (shape?.kind === "circle") setShape({ ...shape, radius: r });
                }}
                className="flex-1"
              />
              <input
                type="number"
                value={radius}
                onChange={(e) => {
                  const r = parseInt(e.target.value) || 0;
                  setRadius(r);
                  if (shape?.kind === "circle") setShape({ ...shape, radius: r });
                }}
                className="w-24 px-2 py-1 border rounded text-sm"
              />
              <span className="text-xs text-gray-500">meters</span>
            </div>
          )}

          <div className="rounded-xl overflow-hidden border">
            <WorkAreaMap
              areas={previewAreas}
              selectedId="draft"
              height={320}
              centerOverride={geo.center}
              zoomOverride={geo.zoom}
              interactiveDraw={method === "draw" ? interactiveDraw : undefined}
            />
          </div>

          {touched && validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {location ? "Save Changes" : "Add Location"}
          </button>
        </div>
      </div>
    </div>
  );
}

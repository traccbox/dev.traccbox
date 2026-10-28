import React, { useState, useMemo } from "react";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Building2,
  Users,
  Settings,
  ClipboardCheck,
  PenTool,
  Globe,
  Type,
  Circle,
  Hexagon,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import WorkAreaMap, { MapArea } from "./WorkAreaMap";
import {
  WorkArea,
  WorkAreaType,
  WORK_AREA_TYPE_OPTIONS,
  DEFAULT_RULES,
  BoundaryShape,
  // WorkAreaRules,
  // WorkAreaLocation,
} from "./types";
import { MOCK_EMPLOYEES } from "./mockData";
import { ADMIN_TREE, findNode } from "./adminData";
import { useStaffData } from "@/api/settingsApi/hooks/useStaffData";
import { useAuth } from "@/components/auth/AuthProvider";
import { getApiErrorMessage } from "@/api/geoFencing/hooksGeoFencing";
import {
  CreateWorkAreaPayload,
  WorkAreaLocation,
} from "@/api/geoFencing/typesGeoFencing";
import {
  getStoredWorkArea,
  INITIAL_WORK_AREA,
  RULE_OPTIONS,
  updateStoredWorkArea,
  WORK_AREA_STORAGE_KEY,
} from "@/utils/workArea";
import { createWorkArea } from "@/api/geoFencing/apiGeoFencing";
import {
  useCountries,
  useStates,
  useLgas,
  useWards,
  useCommunities,
  usePlaceSuggestions,
  usePlaceCoordinates,
} from "@/api/geoFencing/hooksGeoFencing";
import MapSearchBox from "./components/MapSearchBox";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: Building2 },
  { id: 2, label: "Locations", icon: MapPin },
  { id: 3, label: "Employees", icon: Users },
  { id: 4, label: "Work Rules", icon: Settings },
  { id: 5, label: "Review", icon: ClipboardCheck },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateWorkAreaWizard({ open, onClose }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkAreaType>("office");

  // multi-location support
  const [locations, setLocations] = useState<
    CreateWorkAreaPayload["locations"]
  >(INITIAL_WORK_AREA.locations);

  const [locName, setLocName] = useState("");

  const [method, setMethod] = useState<"draw" | "admin" | "manual" | null>(
    null,
  );
  const [drawMode, setDrawMode] = useState<"circle" | "polygon">("circle");
  const [radius, setRadius] = useState(200);
  const [shape, setShape] = useState<BoundaryShape | null>(null);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [community, setCommunity] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const [rules, setRules] = useState<CreateWorkAreaPayload["rules"]>(
    INITIAL_WORK_AREA.rules,
  );

  const [empSearch, setEmpSearch] = useState("");

  const interactiveDraw = useMemo(
    () => ({
      shape,
      onChange: setShape,
      mode: drawMode,
      radius,
    }),
    [shape, drawMode, radius],
  );

  // ---- dynamic administrative cascade ----
  const { data: countriesData = [] } = useCountries();

  const selectedCountryObj = countriesData.find((c) => c.name === country);
  const selectedCountryCode = selectedCountryObj?.code;

  const { data: statesData = [] } = useStates(selectedCountryCode);
  const selectedStateObj = statesData.find((s) => s.name === state);
  const selectedStateId = selectedStateObj?.id;

  const { data: lgasData = [] } = useLgas(selectedStateId);
  const selectedLgaObj = lgasData.find((l) => l.name === lga);
  const selectedLgaId = selectedLgaObj?.id;

  const { data: wardsData = [] } = useWards(selectedLgaId);
  const selectedWardObj = wardsData.find((w) => w.name === ward);
  const selectedWardId = selectedWardObj?.id;

  const { data: communitiesData = [] } = useCommunities(selectedWardId);
  const selectedCommunityObj = communitiesData.find(
    (c) => c.name === community,
  );

  const [drawCenterOverride, setDrawCenterOverride] = useState<
    [number, number] | undefined
  >(undefined);
  const [drawZoomOverride, setDrawZoomOverride] = useState<number | undefined>(
    undefined,
  );

  const [wizardSugOpen, setWizardSugOpen] = useState(false);
  const debouncedLocName = useDebounce(locName, 400);
  const { data: wizardSugRes, isFetching: wizardSugFetching } =
    usePlaceSuggestions(
      debouncedLocName,
      wizardSugOpen && debouncedLocName.trim().length > 1,
    );
  const wizardSuggestions = wizardSugRes?.suggestions || [];
  const wizardResolveCoords = usePlaceCoordinates();

  const { user } = useAuth();
  const companyId = user?.id;

  const adminFocus =
    selectedCommunityObj ||
    selectedWardObj ||
    selectedLgaObj ||
    selectedStateObj ||
    selectedCountryObj;

  const {
    data: teamMembers = [],
    isLoading,
    isError,
    error,
  } = useStaffData(companyId);

  if (!open) return null;

  const resetLocationDraft = () => {
    setMethod(null);
    setShape(null);
    setRadius(200);
    setLocName("");
    setAddress("");
    setLat("");
    setLng("");
    setCountry("");
    setState("");
    setLga("");
    setWard("");
    setCommunity("");
  };

  const reset = () => {
    setStep(1);
    setName("");
    setDescription("");
    setType("office");
    setLocations([]);
    resetLocationDraft();
    setSelectedEmployees([]);
    setRules(INITIAL_WORK_AREA.rules);
  };

  const close = () => {
    reset();
    onClose();
  };

  const draftBoundary = (): BoundaryShape | null => {
    if (shape) return shape;
    if (method === "manual" && lat && lng) {
      return {
        kind: "circle",
        center: [parseFloat(lat), parseFloat(lng)],
        radius: radius || 200,
      };
    }
    if (method === "admin" && adminFocus?.center) {
      return {
        kind: "circle",
        center: adminFocus.center,
        radius: radius || 1000,
      };
    }
    return null;
  };

  const canAddLocation = () => {
    if (!method) return false;
    if (method === "manual") return !!(lat && lng);
    if (method === "admin") return !!(country && state && lga);
    return !!shape;
  };

  const addLocation = () => {
    const boundary = draftBoundary();

    if (!boundary) return;

    const label =
      locName.trim() ||
      (method === "admin"
        ? [community, ward, lga, state].filter(Boolean).join(", ")
        : "") ||
      address ||
      `Location ${locations.length + 1}`;

    const newLocation: WorkAreaLocation = {
      // id: `loc-${Date.now()}`,
      name: label,
      method: method!,
      boundary,
      address: address || undefined,
      country: country || undefined,
      state: state || undefined,
      lga: lga || undefined,
      ward: ward || undefined,
      community: community || undefined,
    };

    setLocations((prev) => {
      const updated = [...prev, newLocation];

      updateStoredWorkArea({
        locations: updated,
      });

      return updated;
    });

    resetLocationDraft();
  };

  const removeLocation = (id: string) => {
    setLocations((prev) => {
      const updated = prev.filter((location) => location.id !== id);

      updateStoredWorkArea({
        locations: updated,
      });

      return updated;
    });
  };

  const updateRules = (updates: Partial<CreateWorkAreaPayload["rules"]>) => {
    setRules((prev) => {
      const updated = {
        ...prev,
        ...updates,
      };

      updateStoredWorkArea({
        rules: updated,
      });

      return updated;
    });
  };

  const saveCurrentStep = () => {
    updateStoredWorkArea({
      name,
      description,
      type,
      locations,
      employee_ids: selectedEmployees,
      rules,
    });
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return locations.length > 0 || canAddLocation();
    return true;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      let currentData = getStoredWorkArea();

      // If the user has a location currently being edited but hasn't
      // clicked "Add location", add it before submitting.
      if (canAddLocation()) {
        const boundary = draftBoundary();

        if (boundary) {
          const newLocation: WorkAreaLocation = {
            name:
              locName.trim() ||
              address ||
              `Location ${currentData.locations.length + 1}`,
            method: method!,
            boundary,
            address: address || undefined,
            country: country || undefined,
            state: state || undefined,
            lga: lga || undefined,
            ward: ward || undefined,
            community: community || undefined,
          };

          currentData = {
            ...currentData,
            locations: [...currentData.locations, newLocation],
          };

          localStorage.setItem(
            WORK_AREA_STORAGE_KEY,
            JSON.stringify(currentData),
          );
        }
      }

      console.log("Creating work area:", currentData);

      try {
        const success = await createWorkArea(currentData);

        if (success) {
          console.log(success);
          queryClient.invalidateQueries({
            queryKey: ["work-areas"],
          });
          toast.success(
            `Work Area ${currentData.name} created successfully!!!`,
          );
          localStorage.removeItem(WORK_AREA_STORAGE_KEY);

          close();
        }
      } catch (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Failed to create work area:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyManualPreview = () => {
    if (lat && lng) {
      setShape({
        kind: "circle",
        center: [parseFloat(lat), parseFloat(lng)],
        radius: radius || 200,
      });
    }
  };

  // Preview areas: saved locations rendered on any wizard map
  const previewAreas: MapArea[] = locations.length
    ? [
        {
          id: "draft",
          name: name || "New Work Area",
          type,
          boundary: locations[0].boundary,
          locations: locations.map((l) => ({
            name: l.name,
            boundary: l.boundary,
          })),
        },
      ]
    : [];

  const selectOptions = (list?: { name: string }[]) =>
    (list || []).map((n) => n.name);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Create Work Area
            </h2>
            <p className="text-xs text-gray-500">
              Set up a new virtual work location
            </p>
          </div>
          <button onClick={close} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-white overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isDone = step > s.id;
              const isActive = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-[#1658E5] text-white shadow-lg shadow-blue-500/30"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${isActive ? "text-[#1658E5]" : isDone ? "text-green-600" : "text-gray-400"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${step > s.id ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Work Area Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;

                    setName(value);

                    updateStoredWorkArea({
                      name: value,
                    });
                  }}
                  placeholder="e.g. Lagos HQ Office"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    const value = e.target.value;

                    setDescription(value);

                    updateStoredWorkArea({
                      description: value,
                    });
                  }}
                  rows={3}
                  placeholder="Short description..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Area Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {WORK_AREA_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setType(o.value);

                        updateStoredWorkArea({
                          type: o.value,
                        });
                      }}
                      className={`px-3 py-2.5 text-sm rounded-lg border-2 text-left transition-all ${
                        type === o.value
                          ? "border-[#1658E5] bg-blue-50 text-[#1658E5] font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Saved locations */}
              {locations.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Locations in this work area ({locations.length})
                    </span>
                  </div>
                  <div className="divide-y">
                    {locations.map((l, i) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1658E5] text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {l.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {l.boundary.kind === "circle"
                              ? `Circle · ${l.boundary.radius}m · [${l.boundary.center[0].toFixed(4)}, ${l.boundary.center[1].toFixed(4)}]`
                              : `Polygon · ${l.boundary.points.length} points`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeLocation(l.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!method && (
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "draw",
                      icon: PenTool,
                      title: "Draw on Map",
                      desc: "Search a location and draw your work area directly on the map.",
                      rec: true,
                    },
                    {
                      id: "admin",
                      icon: Globe,
                      title: "Administrative Area",
                      desc: "Country → State → LGA → Ward → Community.",
                    },
                    {
                      id: "manual",
                      icon: Type,
                      title: "Manual Entry",
                      desc: "Create using an address or GPS coordinates.",
                    },
                  ].map((c: any) => {
                    const Icon = c.icon;
                    return (
                      <div
                        key={c.id}
                        className="border-2 rounded-2xl p-5 hover:border-[#1658E5] hover:shadow-lg transition-all cursor-pointer relative"
                        onClick={() => setMethod(c.id)}
                      >
                        {c.rec && (
                          <span className="absolute top-3 right-3 text-[10px] bg-blue-100 text-[#1658E5] font-semibold px-2 py-0.5 rounded-full">
                            RECOMMENDED
                          </span>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                          <Icon className="w-6 h-6 text-[#1658E5]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {c.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">{c.desc}</p>
                        <button className="w-full bg-[#1658E5] text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                          {locations.length ? "Add another location" : "Select"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {method === "draw" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <div className="relative">
                        <input
                          value={locName}
                          onChange={(e) => {
                            setLocName(e.target.value);
                            setWizardSugOpen(true);
                          }}
                          onFocus={() => setWizardSugOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setWizardSugOpen(false), 250)
                          }
                          placeholder="Location name (optional)"
                          className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                        {(wizardSugFetching ||
                          wizardResolveCoords.isPending) && (
                          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                        )}
                      </div>
                      {wizardSugOpen && wizardSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-[500] mt-1 bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {wizardSuggestions.map((r, i) => (
                            <button
                              key={`${r.place_id}-${i}`}
                              type="button"
                              disabled={wizardResolveCoords.isPending}
                              onClick={() => {
                                wizardResolveCoords.mutate(r.place_id, {
                                  onSuccess: (coords) => {
                                    setLocName(r.description);
                                    setWizardSugOpen(false);
                                    setDrawCenterOverride([
                                      coords.latitude,
                                      coords.longitude,
                                    ]);
                                    setDrawZoomOverride(15);
                                    setShape({
                                      kind: "circle",
                                      center: [
                                        coords.latitude,
                                        coords.longitude,
                                      ],
                                      radius,
                                    });
                                  },
                                });
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b last:border-b-0 text-gray-800 disabled:opacity-50"
                            >
                              {r.description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                      <button
                        onClick={() => {
                          setDrawMode("circle");
                          setShape(null);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${drawMode === "circle" ? "bg-white shadow text-[#1658E5]" : "text-gray-600"}`}
                      >
                        <Circle className="w-3.5 h-3.5" /> Circle
                      </button>
                      <button
                        onClick={() => {
                          setDrawMode("polygon");
                          setShape(null);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${drawMode === "polygon" ? "bg-white shadow text-[#1658E5]" : "text-gray-600"}`}
                      >
                        <Hexagon className="w-3.5 h-3.5" /> Polygon
                      </button>
                    </div>
                    <button
                      onClick={() => setShape(null)}
                      className="p-2 border rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600"
                      title="Clear shape"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={resetLocationDraft}
                      className="text-xs text-gray-500 hover:underline ml-auto"
                    >
                      Change method
                    </button>
                  </div>

                  {drawMode === "circle" && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Radius:
                      </span>
                      <input
                        type="range"
                        min={50}
                        max={5000}
                        step={50}
                        value={radius}
                        onChange={(e) => {
                          const r = parseInt(e.target.value);
                          setRadius(r);
                          if (shape?.kind === "circle")
                            setShape({ ...shape, radius: r });
                        }}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => {
                          const r = parseInt(e.target.value) || 0;
                          setRadius(r);
                          if (shape?.kind === "circle")
                            setShape({ ...shape, radius: r });
                        }}
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">meters</span>
                    </div>
                  )}

                  <MapSearchBox
                    onPick={({ lat: la, lng: ln }) => {
                      setDrawMode("circle");
                      setShape({ kind: "circle", center: [la, ln], radius });
                      setDrawCenterOverride([la, ln]);
                      setDrawZoomOverride(15);
                    }}
                    placeholder="Search a place to centre the map…"
                  />

                  <div className="rounded-xl overflow-hidden border">
                    <WorkAreaMap
                      areas={previewAreas}
                      height={380}
                      interactiveDraw={interactiveDraw}
                      centerOverride={drawCenterOverride}
                      zoomOverride={drawZoomOverride}
                    />
                  </div>

                  {drawMode === "polygon" && shape?.kind === "polygon" && (
                    <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {shape.points.length} points placed (min 3)
                      </span>
                      <button
                        onClick={() => setShape(null)}
                        className="text-sm text-red-600"
                      >
                        Clear points
                      </button>
                    </div>
                  )}
                  {!shape && (
                    <p className="text-xs text-center text-gray-500">
                      Click on the map to{" "}
                      {drawMode === "circle"
                        ? "place the circle center"
                        : "add polygon points"}
                    </p>
                  )}
                </div>
              )}

              {method === "admin" && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <button
                      onClick={resetLocationDraft}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      ← Change method
                    </button>
                    <AdminSelect
                      label="Country *"
                      value={country}
                      options={selectOptions(countriesData)}
                      onChange={(v) => {
                        setCountry(v);
                        setState("");
                        setLga("");
                        setWard("");
                        setCommunity("");
                        setShape(null);
                      }}
                    />
                    <AdminSelect
                      label="State *"
                      value={state}
                      options={selectOptions(statesData)}
                      disabled={!country}
                      onChange={(v) => {
                        setState(v);
                        setLga("");
                        setWard("");
                        setCommunity("");
                        setShape(null);
                      }}
                    />
                    <AdminSelect
                      label="Local Government *"
                      value={lga}
                      options={selectOptions(lgasData)}
                      disabled={!state}
                      onChange={(v) => {
                        setLga(v);
                        setWard("");
                        setCommunity("");
                        setShape(null);
                      }}
                    />
                    <AdminSelect
                      label="Ward"
                      value={ward}
                      options={selectOptions(wardsData)}
                      disabled={!lga}
                      onChange={(v) => {
                        setWard(v);
                        setCommunity("");
                        setShape(null);
                      }}
                    />
                    <AdminSelect
                      label="Community"
                      value={community}
                      options={selectOptions(communitiesData)}
                      disabled={!ward}
                      onChange={(v) => {
                        setCommunity(v);
                        setShape(null);
                      }}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Coverage radius (m)
                      </label>
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => {
                          const r = parseInt(e.target.value) || 0;
                          setRadius(r);
                          if (shape?.kind === "circle")
                            setShape({ ...shape, radius: r });
                        }}
                        className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      The map focuses on your selection. You can also click the
                      map to fine-tune the boundary centre.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Map
                    </label>
                    <div className="rounded-xl overflow-hidden border">
                      <WorkAreaMap
                        areas={previewAreas}
                        height={380}
                        interactiveDraw={{
                          shape:
                            shape ||
                            (adminFocus?.center
                              ? {
                                  kind: "circle",
                                  center: adminFocus.center,
                                  radius,
                                }
                              : null),
                          onChange: (s) => setShape(s),
                          mode: "circle",
                          radius,
                        }}
                        centerOverride={adminFocus?.center}
                        zoomOverride={adminFocus?.zoom}
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === "manual" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <button
                      onClick={resetLocationDraft}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      ← Change method
                    </button>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1.5">
                        Location name
                      </label>
                      <div className="relative">
                        <input
                          value={locName}
                          onChange={(e) => {
                            setLocName(e.target.value);
                            setWizardSugOpen(true);
                          }}
                          onFocus={() => setWizardSugOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setWizardSugOpen(false), 250)
                          }
                          placeholder="e.g. Ikeja HQ"
                          className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                        {(wizardSugFetching ||
                          wizardResolveCoords.isPending) && (
                          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                        )}
                      </div>
                      {wizardSugOpen && wizardSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-[500] mt-1 bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {wizardSuggestions.map((r, i) => (
                            <button
                              key={`${r.place_id}-${i}`}
                              type="button"
                              disabled={wizardResolveCoords.isPending}
                              onClick={() => {
                                wizardResolveCoords.mutate(r.place_id, {
                                  onSuccess: (coords) => {
                                    setLocName(r.description);
                                    setWizardSugOpen(false);
                                    setLat(coords.latitude.toString());
                                    setLng(coords.longitude.toString());
                                    setShape({
                                      kind: "circle",
                                      center: [
                                        coords.latitude,
                                        coords.longitude,
                                      ],
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
                      <label className="block text-sm font-medium mb-1.5">
                        Address
                      </label>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Latitude
                        </label>
                        <input
                          value={lat}
                          onChange={(e) => setLat(e.target.value)}
                          placeholder="6.5244"
                          className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Longitude
                        </label>
                        <input
                          value={lng}
                          onChange={(e) => setLng(e.target.value)}
                          placeholder="3.3792"
                          className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Radius (m)
                      </label>
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) =>
                          setRadius(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={applyManualPreview}
                      className="w-full bg-[#1658E5] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Generate Preview
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Preview
                    </label>
                    <div className="rounded-xl overflow-hidden border">
                      <WorkAreaMap
                        areas={previewAreas}
                        height={320}
                        interactiveDraw={{
                          shape,
                          onChange: setShape,
                          mode: "circle",
                          radius,
                        }}
                        centerOverride={
                          lat && lng
                            ? [parseFloat(lat), parseFloat(lng)]
                            : undefined
                        }
                        zoomOverride={15}
                      />
                    </div>
                  </div>
                </div>
              )}

              {method && (
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    onClick={resetLocationDraft}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!canAddLocation()}
                    onClick={addLocation}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-[#1658E5] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add location
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="md:col-span-2 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option>All Departments</option>
                  <option>Sales</option>
                  <option>Engineering</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option>All Teams</option>
                  <option>Alpha</option>
                  <option>Beta</option>
                </select>
              </div>
              {isLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="text-sm text-gray-500">
                    Loading team members...
                  </div>
                </div>
              )}

              {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">
                    Failed to load team members.
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    {getApiErrorMessage(
                      error,
                      "Unable to retrieve team members.",
                    )}
                  </p>
                </div>
              )}

              {!isLoading && !isError && (
                <div className="border rounded-xl divide-y max-h-80 overflow-y-auto">
                  {teamMembers
                    .filter((member) => {
                      const search = empSearch.toLowerCase();

                      return (
                        member.name?.toLowerCase().includes(search) ||
                        member.email?.toLowerCase().includes(search)
                      );
                    })
                    .map((member) => {
                      const checked = selectedEmployees.includes(member.id);

                      return (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedEmployees((prev) => {
                                const updated = prev.includes(member.id)
                                  ? prev.filter((id) => id !== member.id)
                                  : [...prev, member.id];

                                updateStoredWorkArea({
                                  employee_ids: updated,
                                });

                                return updated;
                              });
                            }}
                            className="w-4 h-4 accent-[#1658E5]"
                          />

                          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                            {member.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {member.name}
                            </div>

                            <div className="text-xs text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-[#1658E5]">
                  {selectedEmployees.length}
                </span>{" "}
                employee(s) selected
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Working Days
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d) => {
                    const active = rules.working_days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          updateRules({
                            working_days: active
                              ? rules.working_days.filter((day) => day !== d)
                              : [...rules.working_days, d],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm border-2 ${active ? "border-[#1658E5] bg-blue-50 text-[#1658E5] font-semibold" : "border-gray-200 text-gray-600"}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={rules.working_hours.start}
                    onChange={(e) =>
                      updateRules({
                        working_hours: {
                          ...rules.working_hours,
                          start: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={rules.working_hours.end}
                    onChange={(e) =>
                      updateRules({
                        working_hours: {
                          ...rules.working_hours,
                          end: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    GPS Accuracy (m)
                  </label>
                  <input
                    type="number"
                    value={rules.gps_accuracy}
                    onChange={(e) =>
                      updateRules({
                        gps_accuracy: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Grace Period (min)
                  </label>
                  <input
                    type="number"
                    value={rules.grace_period}
                    onChange={(e) =>
                      updateRules({
                        grace_period: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2 pt-2">
                {RULE_OPTIONS.map(([k, label]) => (
                  <label
                    key={k}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={rules[k] as boolean}
                      onChange={(e) =>
                        setRules({ ...rules, [k]: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#1658E5]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <SummaryBlock title="Basic Information">
                <SummaryRow label="Name" value={name} />
                <SummaryRow
                  label="Type"
                  value={
                    WORK_AREA_TYPE_OPTIONS.find((o) => o.value === type)
                      ?.label || type
                  }
                />
                {description && (
                  <SummaryRow label="Description" value={description} />
                )}
              </SummaryBlock>
              <SummaryBlock title={`Locations (${locations.length})`}>
                {locations.map((l, i) => (
                  <SummaryRow
                    key={l.id}
                    label={`${i + 1}. ${l.name}`}
                    value={
                      l.boundary.kind === "circle"
                        ? `Circle · [${l.boundary.center[0].toFixed(4)}, ${l.boundary.center[1].toFixed(4)}] · r=${l.boundary.radius}m`
                        : `Polygon · ${l.boundary.points.length} points`
                    }
                  />
                ))}
                {locations.length === 0 && (
                  <SummaryRow label="—" value="No locations added" />
                )}
              </SummaryBlock>
              <SummaryBlock title="Assigned Employees">
                <SummaryRow
                  label="Count"
                  value={`${selectedEmployees.length} employee(s)`}
                />
              </SummaryBlock>
              <SummaryBlock title="Work Rules">
                <SummaryRow
                  label="Working Days"
                  value={rules.working_days.join(", ")}
                />
                <SummaryRow
                  label="Hours"
                  value={`${rules.working_hours.start} – ${rules.working_hours.end}`}
                />
                <SummaryRow
                  label="Grace Period"
                  value={`${rules.grace_period} min`}
                />
              </SummaryBlock>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={() => (step === 1 ? close() : setStep(step - 1))}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="text-xs text-gray-500">
            Step {step} of {STEPS.length}
          </div>
          {step < 5 ? (
            <button
              disabled={!canProceed()}
              onClick={() => {
                saveCurrentStep();
                setStep(step + 1);
              }}
              className="flex items-center gap-1 px-5 py-2 bg-[#1658E5] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Work Area"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">
          {disabled ? "Select the level above first" : "Select..."}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="text-gray-500 w-40">{label}</span>
      <span className="text-gray-900 font-medium flex-1">{value}</span>
    </div>
  );
}

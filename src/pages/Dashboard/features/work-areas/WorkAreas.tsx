import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MapPinned,
  CheckCircle2,
  Users,
  Edit,
  Trash2,
  Maximize2,
  Layers,
  Building2,
  LucideIcon,
  Compass,
  Crosshair,
  AlertTriangle,
  MapPin,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { WORK_AREA_TYPE_OPTIONS, WorkAreaType, WorkAreaStatus } from "./types";
import WorkAreaMap from "./WorkAreaMap";
import CreateWorkAreaWizard from "./CreateWorkAreaWizard";
import WorkAreaDashboard from "./WorkAreaDashboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkAreaById,
  getWorkAreas,
  getWorkAreaStats,
} from "@/api/geoFencing/apiGeoFencing";
import { useMyWorkAreas, useCheckGeofence, useAssignableEmployees } from "@/api/geoFencing/hooksGeoFencing";
import { useDebounce } from "@/hooks/useDebounce";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

const TYPE_DOT: Record<string, string> = {
  office: "bg-blue-500",
  sales_territory: "bg-purple-500",
  warehouse: "bg-amber-500",
  service_zone: "bg-emerald-500",
  delivery_zone: "bg-pink-500",
  client_location: "bg-cyan-500",
  construction_site: "bg-red-500",
  market: "bg-teal-500",
  custom: "bg-indigo-500",
};

export default function WorkAreas() {
  const { isStaff, user, staff } = useAuth();
  const companyId = staff?.company_id || user?.id || "";
  const [activeTab, setActiveTab] = useState<"all" | "mine">(isStaff ? "mine" : "all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkAreaStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | WorkAreaType>("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mapSearch, setMapSearch] = useState("");

  // Geofence Tester State
  const [testerLat, setTesterLat] = useState("");
  const [testerLng, setTesterLng] = useState("");
  const [testerAccuracy, setTesterAccuracy] = useState("10");
  const [testerEmployeeId, setTesterEmployeeId] = useState("");
  const [testerQrCode, setTesterQrCode] = useState("");
  const [testerResult, setTesterResult] = useState<any | null>(null);

  const checkGeofenceMutation = useCheckGeofence();
  const { data: assignableEmployeesData } = useAssignableEmployees({ limit: 100 });
  const employeesList = assignableEmployeesData?.data ?? [];

  const handleCheckGeofence = () => {
    const latNum = parseFloat(testerLat);
    const lngNum = parseFloat(testerLng);
    const accNum = parseFloat(testerAccuracy) || 0;

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Please enter a valid latitude and longitude.");
      return;
    }

    checkGeofenceMutation.mutate(
      {
        employee_id: testerEmployeeId,
        lat: latNum,
        lng: lngNum,
        accuracy: accNum,
        company_id: companyId,
        qr_code: testerQrCode,
      },
      {
        onSuccess: (data) => {
          setTesterResult(data);
          toast.success("Geofence check completed!");
        },
        onError: (err: any) => {
          console.error("Geofence check failed:", err);
          setTesterResult(null);
        },
      }
    );
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.info("Retrieving your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTesterLat(position.coords.latitude.toFixed(6));
        setTesterLng(position.coords.longitude.toFixed(6));
        if (position.coords.accuracy) {
          setTesterAccuracy(Math.round(position.coords.accuracy).toString());
        }
        toast.success("Location retrieved!");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error(`Failed to get location: ${error.message}`);
      }
    );
  };

  const debouncedSearch = useDebounce(search, 500);

  const queryClient = useQueryClient();

  // Get Work Areas
  const {
    data: workAreasResponse,
    isLoading: isLoadingWorkAreas,
    isError: isWorkAreasError,
    error: workAreasError,
  } = useQuery({
    queryKey: [
      "work-areas",
      {
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter,
        page,
        limit,
      },
    ],
    queryFn: () =>
      getWorkAreas({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
        page,
        limit,
      }),
    enabled: activeTab === "all",
  });

  // Get My Work Areas
  const {
    data: myWorkAreasResponse,
    isLoading: isLoadingMyWorkAreas,
    isError: isMyWorkAreasError,
    error: myWorkAreasError,
  } = useMyWorkAreas(activeTab === "mine");

  // Get AREA STATS
  const {
    data: workAreaStats,
    isLoading: isLoadingStats,
    isError: isStatsError,
    error: statsError,
  } = useQuery({
    queryKey: ["work-area-stats"],
    queryFn: getWorkAreaStats,
    enabled: !isStaff,
  });

  const stats = workAreaStats || {
    total_areas: 0,
    active_areas: 0,
    inactive_areas: 0,
    employees_assigned: 0,
    employees_inside: 0,
    violations_today: 0,
  };

  // Delete Work Area
  const { mutate: onDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteWorkAreaById,
    onSuccess: () => {
      toast.success("Work area deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["work-areas"] });
      queryClient.invalidateQueries({ queryKey: ["my-work-areas"] });
      queryClient.invalidateQueries({ queryKey: ["work-area-stats"] });
      queryClient.invalidateQueries({ queryKey: ["work-area"] });
    },
    onError: (error) => {
      console.error("Failed to delete work area:", error);
      toast.error("Failed to delete work area");
    },
  });

  const isLoading = activeTab === "mine" ? isLoadingMyWorkAreas : isLoadingWorkAreas;
  const isError = activeTab === "mine" ? isMyWorkAreasError : isWorkAreasError;
  const error = activeTab === "mine" ? myWorkAreasError : workAreasError;
  const showStatsLoading = !isStaff && isLoadingStats;
  const showStatsError = !isStaff && isStatsError;

  if (isLoading || showStatsLoading) {
    return (
      <div className="w-full bg-slate-200 h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (detailsId) {
    return (
      <WorkAreaDashboard
        id={detailsId}
        onClose={() => setDetailsId(null)}
      />
    );
  }

  if (isError || showStatsError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Failed to load work area information
          </h2>

          {isError && (
            <p className="mt-2 text-sm text-red-600">
              Work areas:{" "}
              {error instanceof Error
                ? error.message
                : "Failed to load work areas."}
            </p>
          )}

          {showStatsError && (
            <p className="mt-1 text-sm text-red-600">
              Statistics:{" "}
              {statsError instanceof Error
                ? statsError.message
                : "Failed to load work area statistics."}
            </p>
          )}
        </div>
      </div>
    );
  }

  const areas = (activeTab === "mine" ? myWorkAreasResponse?.data : workAreasResponse?.data) ?? [];
  console.log("HI", areas);



  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Areas</h1>
          <p className="text-sm text-gray-500">
            Create and manage virtual work locations for your teams
          </p>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-1 gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Work Areas
          </button>
          <button
            onClick={() => {
              setActiveTab("mine");
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "mine"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            My Assigned Areas
          </button>
        </div>

        {!isStaff && (
          <button
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
          >
            <Plus className="w-4 h-4" /> Create Work Area
          </button>
        )}
      </div>

      {/* Filters */}
      {/* Filters */}
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search work areas, employees, state, LGA…"
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | WorkAreaStatus);
            setPage(1);
          }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as "all" | WorkAreaType);
            setPage(1);
          }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {WORK_AREA_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {!isStaff && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={MapPinned}
            label="Total Work Areas"
            value={stats.total_areas ?? 0}
            tint="from-blue-500 to-blue-700"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active Work Areas"
            value={stats.active_areas ?? 0}
            tint="from-emerald-500 to-emerald-700"
          />
          <StatCard
            icon={AlertTriangle}
            label="Inactive Work Areas"
            value={stats.inactive_areas ?? 0}
            tint="from-amber-500 to-amber-700"
          />
          <StatCard
            icon={Users}
            label="Assigned Employees"
            value={stats.employees_assigned ?? 0}
            tint="from-purple-500 to-purple-700"
          />
          <StatCard
            icon={MapPin}
            label="Employees Inside"
            value={stats.employees_inside ?? 0}
            tint="from-cyan-500 to-cyan-700"
          />
          <StatCard
            icon={XCircle}
            label="Violations Today"
            value={stats.violations_today ?? 0}
            tint="from-rose-500 to-rose-700"
          />
        </div>
      )}

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: list */}
        <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Work Area List</h3>
            <span className="text-xs text-gray-500">
              {areas.length} of {areas.length}
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {areas.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No work areas found
              </div>
            )}
            {areas.map((a) => (
              <div
                key={a.id}
                onClick={() => setDetailsId(a.id)}
                className="group px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-l-4 border-transparent"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${TYPE_DOT[a.type] || "bg-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {a.name}
                      </h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          a.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {a.description || "---"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {a.employee_count}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>
                        {
                          WORK_AREA_TYPE_OPTIONS.find((o) => o.value === a.type)
                            ?.label
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(a.id);
                      }}
                      className="p-1.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:text-gray-500 rounded-md text-red-600 cursor-pointer"
                      title="Delete"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: map */}
        <div
          className={`lg:col-span-3 bg-white border rounded-2xl overflow-hidden ${fullscreen ? "fixed inset-4 z-[80] col-span-full" : ""}`}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search location on map…"
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setSatellite(!satellite)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium ${satellite ? "bg-blue-50 text-[#1658E5] border-blue-200" : "text-gray-600"}`}
            >
              <Layers className="w-3.5 h-3.5" />{" "}
              {satellite ? "Satellite" : "Map"}
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Maximize2 className="w-3.5 h-3.5" />{" "}
              {fullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
          <WorkAreaMap
            areas={areas || []}
            selectedId={selectedId}
            onSelect={setSelectedId}
            satellite={satellite}
            height={fullscreen ? "calc(100vh - 140px)" : 560}
          />
        </div>
      </div>

      {/* Geofence Tester */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#1658E5]" />
            Geofence Tester & Validation Tool
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Test and verify whether a coordinate falls inside any active work area. 
            You can use manual inputs or fetch your browser's current location.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Latitude</label>
            <input
              type="number"
              step="any"
              value={testerLat}
              onChange={(e) => setTesterLat(e.target.value)}
              placeholder="e.g. 6.6019"
              className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Longitude</label>
            <input
              type="number"
              step="any"
              value={testerLng}
              onChange={(e) => setTesterLng(e.target.value)}
              placeholder="e.g. 3.3512"
              className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Accuracy (m)</label>
            <input
              type="number"
              value={testerAccuracy}
              onChange={(e) => setTesterAccuracy(e.target.value)}
              placeholder="e.g. 15"
              className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Staff Member (Optional)</label>
            <select
              value={testerEmployeeId}
              onChange={(e) => setTesterEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            >
              <option value="">-- Generic Check --</option>
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role || "Staff"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">QR Code (Optional)</label>
            <input
              type="text"
              value={testerQrCode}
              onChange={(e) => setTesterQrCode(e.target.value)}
              placeholder="QR Code payload"
              className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-gray-500" />
            Get My Location
          </button>
          <button
            type="button"
            onClick={handleCheckGeofence}
            disabled={checkGeofenceMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1658E5] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {checkGeofenceMutation.isPending ? "Checking..." : "Run Geofence Check"}
          </button>
        </div>

        {/* Tester Results Display */}
        {testerResult && (
          <div
            className={`mt-4 border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              testerResult.inside
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {testerResult.inside ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-bold flex items-center gap-2">
                  {testerResult.inside ? "Inside Geofence" : "Outside Geofence"}
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      testerResult.can_clock_in
                        ? "bg-green-200 text-green-900"
                        : "bg-red-200 text-red-900"
                    }`}
                  >
                    {testerResult.can_clock_in ? "Can Clock In" : "Cannot Clock In"}
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[11px] opacity-90">
                  {testerResult.work_area_id && (
                    <p>
                      <strong>Work Area ID:</strong> {testerResult.work_area_id}
                    </p>
                  )}
                  {testerResult.location_id && (
                    <p>
                      <strong>Location ID:</strong> {testerResult.location_id}
                    </p>
                  )}
                  {testerResult.distance_from_edge !== undefined && (
                    <p>
                      <strong>Distance from Edge:</strong> {Math.round(testerResult.distance_from_edge)} meters
                    </p>
                  )}
                  {testerResult.reason && (
                    <p className="sm:col-span-2">
                      <strong>Reason:</strong> {testerResult.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {testerResult.inside && testerResult.work_area_id && (
              <button
                type="button"
                onClick={() => {
                  if (testerResult.work_area_id) {
                    setSelectedId(testerResult.work_area_id);
                  }
                }}
                className="self-start md:self-center px-3 py-1 border rounded-lg text-xs font-semibold bg-white text-green-800 hover:bg-green-100 transition-colors whitespace-nowrap"
              >
                Highlight Area
              </button>
            )}
          </div>
        )}
      </div>

      <CreateWorkAreaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}

type StatCardProp = {
  label: string;
  value: string | number;
  tint: string;
  icon: LucideIcon;
};

function StatCard({ icon: Icon, label, value, tint }: StatCardProp) {
  return (
    <div className="relative overflow-hidden bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${tint} opacity-10`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Clock,
  Download,
  Gauge,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Route as RouteIcon,
  Search,
  TimerReset,
  Users,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import Pagination from "@/components/dashboard/Pagination";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/dashboard/States";
import RouteMap from "./RouteMap";
import TravelTrendCard from "./TravelTrendCard";
import LivePositionsCard from "./LivePositionsCard";
import { exportCSV } from "@/utils/exportData";
import {
  getTravelFilters,
  getTravelSummary,
  getTravelTrips,
  getTripDetail,
  getTripRoute,
  getTripStops,
} from "@/api/travels/apiTravels";
import Spinner from "@/components/ui/Spinner";
import {
  FilterOption,
  TravelFilterValues,
  TravelTrip,
} from "@/api/travels/types";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 8;
const EXPORT_LIMIT = 100; // API max per_page

const selectClass =
  "h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700 bg-white";

const FilterSelect: React.FC<{
  value: string | undefined;
  onChange: (v: string) => void;
  allLabel: string;
  options: FilterOption[];
}> = ({ value, onChange, allLabel, options }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    className={selectClass}
  >
    <option value="">{allLabel}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const Avatar: React.FC<{ name: string; photo: string | null }> = ({
  name,
  photo,
}) =>
  photo ? (
    <img
      src={photo}
      alt={name}
      className="w-7 h-7 rounded-full object-cover"
      loading="lazy"
    />
  ) : (
    <span className="w-7 h-7 rounded-full bg-blue-100 text-[#1658E5] text-[10px] font-semibold flex items-center justify-center">
      {name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );

const TravelMonitoring: React.FC = () => {
  const [filters, setFilters] = useState<TravelFilterValues>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 400);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  // ── Filter options (GET /travel/filters) ──────────────────────────────────
  const { data: filterOptions } = useQuery({
    queryKey: ["travel-filters"],
    queryFn: getTravelFilters,
    staleTime: 5 * 60 * 1000,
  });

  // ── Summary (GET /travel/summary): only takes the org filters ─────────────
  const summaryParams = {
    employee_id: filters.employee_id,
    branch: filters.branch,
    team: filters.team,
    department: filters.department,
  };
  const {
    data: travelSummary,
    isLoading: isGettingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["travel-summary", summaryParams],
    queryFn: () => getTravelSummary(summaryParams),
    placeholderData: keepPreviousData,
  });

  // ── Trips (GET /travel/trips): server-side filter / search / pagination ───
  const tripParams = {
    ...filters,
    search: search || undefined,
    page,
    per_page: PAGE_SIZE,
  };
  const {
    data: travelTrips,
    isLoading: isGettingTrips,
    isError: isTripsError,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ["travel-trips", tripParams],
    queryFn: () => getTravelTrips(tripParams),
    placeholderData: keepPreviousData,
  });

  const rows: TravelTrip[] = travelTrips?.data ?? [];
  const total = travelTrips?.meta?.total ?? rows.length;

  // The trip shown in the panel: the clicked one, else the first in the list
  const activeTripId =
    selectedId && rows.some((r) => r.id === selectedId)
      ? selectedId
      : (rows[0]?.id ?? null);
  const selected = rows.find((r) => r.id === activeTripId);

  // ── Selected trip: detail, route and stops ────────────────────────────────
  const { data: tripDetail } = useQuery({
    queryKey: ["travel-trip", activeTripId],
    queryFn: () => getTripDetail(activeTripId as string),
    enabled: Boolean(activeTripId),
  });
  const {
    data: tripRoute,
    isLoading: isGettingRoute,
    isError: isRouteError,
  } = useQuery({
    queryKey: ["travel-trip-route", activeTripId],
    queryFn: () => getTripRoute(activeTripId as string),
    enabled: Boolean(activeTripId),
  });
  const { data: tripStops } = useQuery({
    queryKey: ["travel-trip-stops", activeTripId],
    queryFn: () => getTripStops(activeTripId as string),
    enabled: Boolean(activeTripId),
  });
  const routePoints = tripRoute?.data?.points ?? [];
  const detail = tripDetail?.data ?? selected;

  // New trip: restart playback
  useEffect(() => {
    setPlaying(false);
    setPlayIndex(0);
  }, [activeTripId]);

  // Route playback
  useEffect(() => {
    if (!playing || routePoints.length === 0) return;
    const t = setInterval(() => {
      setPlayIndex((i) => {
        if (i >= routePoints.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [playing, routePoints.length]);

  const setFilter = (k: keyof TravelFilterValues, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };
  const hasActiveFilters =
    Object.values(filters).some(Boolean) || searchInput !== "";
  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
    setPage(1);
  };

  // Export every trip matching the filters (up to the API's per_page max),
  // not only the visible page
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getTravelTrips({
        ...filters,
        search: search || undefined,
        page: 1,
        per_page: EXPORT_LIMIT,
      });
      exportCSV(
        res.data.map((r) => ({
          Employee: r.employee,
          Date: r.date,
          "Distance (km)": r.distance_km,
          "Time Moving": r.time_moving_label,
          "Idle Time": r.idle_time_label,
          "Check-in": r.check_in ?? "",
          "Check-out": r.check_out ?? "",
          Stops: r.stops_count,
          Branch: r.branch ?? "",
          Team: r.team ?? "",
        })),
        "travel-monitoring.csv",
      );
    } catch (err) {
      console.error("Travel export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const summary = travelSummary?.data;

  return (
    <div>
      <PageHeader
        title="Travel Monitoring"
        description="GPS movement analytics, routes and stop analysis for field reps."
        crumbs={[{ label: "Travel Monitoring" }]}
        actions={
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd] disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      {/* Summary cards */}
      {isSummaryError ? (
        <ErrorState onRetry={() => refetchSummary()} />
      ) : isGettingSummary || !summary ? (
        <CardsSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            index={0}
            title="Distance Today"
            value={`${summary.distance_today_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
          />
          <StatCard
            index={1}
            title="Distance This Week"
            value={`${summary.distance_week_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
          />
          <StatCard
            index={2}
            title="Distance This Month"
            value={`${summary.distance_month_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
          />
          <StatCard
            index={3}
            title="Total Stops"
            value={summary.total_stops}
            icon={<MapPin className="w-4 h-4" />}
          />
          <StatCard
            index={4}
            title="Moving Time"
            value={summary.moving_time_label}
            icon={<Clock className="w-4 h-4" />}
          />
          <StatCard
            index={5}
            title="Idle Time"
            value={summary.idle_time_label}
            icon={<TimerReset className="w-4 h-4" />}
          />
          <StatCard
            index={6}
            title="Average Speed"
            value={`${summary.average_speed_kmh} km/h`}
            subtitle={`Max ${summary.max_speed_kmh} km/h`}
            icon={<Gauge className="w-4 h-4" />}
          />
          <StatCard
            index={7}
            title="Active Trips"
            value={summary.active_trips}
            subtitle={`${summary.employees_tracked} employees tracked`}
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="date"
          aria-label="From date"
          value={filters.start_date ?? ""}
          max={filters.end_date}
          onChange={(e) => setFilter("start_date", e.target.value)}
          className={selectClass}
        />
        <input
          type="date"
          aria-label="To date"
          value={filters.end_date ?? ""}
          min={filters.start_date}
          onChange={(e) => setFilter("end_date", e.target.value)}
          className={selectClass}
        />
        <FilterSelect
          value={filters.employee_id}
          onChange={(v) => setFilter("employee_id", v)}
          allLabel="All Employees"
          options={filterOptions?.employees ?? []}
        />
        <FilterSelect
          value={filters.department}
          onChange={(v) => setFilter("department", v)}
          allLabel="All Departments"
          options={filterOptions?.departments ?? []}
        />
        <FilterSelect
          value={filters.branch}
          onChange={(v) => setFilter("branch", v)}
          allLabel="All Branches"
          options={filterOptions?.branches ?? []}
        />
        <FilterSelect
          value={filters.team}
          onChange={(v) => setFilter("team", v)}
          allLabel="All Teams"
          options={filterOptions?.teams ?? []}
        />
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search employee…"
            className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          <X className="w-4 h-4" /> Clear filters
        </button>
      </div>

      <TravelTrendCard filters={filters} />

      {/* Map + playback */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Route Playback
            </h2>
            <p className="text-[11px] text-gray-500">
              {detail
                ? `${detail.employee} • ${detail.date} • ${detail.distance_km} km`
                : "Select a trip from the table below"}
            </p>
            {detail && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {detail.status} • avg {detail.average_speed_kmh} km/h •{" "}
                {detail.stops_count} stops
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={routePoints.length < 2}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#1658E5] text-xs font-medium text-white disabled:opacity-40"
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setPlayIndex(0);
              }}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {activeTripId ? (
          <>
            {isGettingRoute ? (
              <div className="text-center h-[200px] py-4">
                <Spinner />
              </div>
            ) : isRouteError ? (
              <EmptyState title="Failed to load route" />
            ) : routePoints.length === 0 ? (
              <EmptyState title="No route points for this trip" />
            ) : (
              <RouteMap
                route={routePoints}
                stops={tripStops?.stops}
                playbackIndex={playIndex}
              />
            )}
            <input
              type="range"
              min={0}
              max={Math.max(routePoints.length - 1, 0)}
              value={playIndex}
              disabled={routePoints.length === 0}
              onChange={(e) => setPlayIndex(Number(e.target.value))}
              className="w-full mt-3 accent-[#1658E5]"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Start{" "}
                {routePoints[0]?.time || "----"}
              </span>
              <span>Current: {routePoints[playIndex]?.time || "----"}</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> End{" "}
                {routePoints[routePoints.length - 1]?.time || "----"}
              </span>
            </div>

            {/* Stops (GET /travel/trips/{id}/stops) */}
            {tripStops && tripStops.stops.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">
                  Stops ({tripStops.stops.length})
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tripStops.stops.map((s, i) => (
                    <li
                      key={`${s.lat}-${s.lng}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-gray-700"
                    >
                      <span className="font-medium truncate mr-2">
                        {s.label || `Stop ${i + 1}`}
                      </span>
                      <span className="text-gray-500 whitespace-nowrap">
                        {s.arrived_at ?? "—"}
                        {s.duration_minutes != null
                          ? ` • ${Math.round(s.duration_minutes)} min`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No route to display" />
        )}
      </div>

      <LivePositionsCard filters={filters} />

      {/* Trips table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Trips</h2>
          <span className="text-xs text-gray-500">{total} records</span>
        </div>
        {isTripsError ? (
          <ErrorState onRetry={() => refetchTrips()} />
        ) : isGettingTrips ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState title="No trips found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {[
                    "Employee",
                    "Date",
                    "Distance",
                    "Time Moving",
                    "Idle Time",
                    "Stops",
                    "Check-in",
                    "Check-out",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left font-medium px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`border-t border-gray-50 cursor-pointer transition-colors ${
                      activeTripId === r.id
                        ? "bg-blue-50/70"
                        : "hover:bg-blue-50/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.employee} photo={r.photo} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {r.employee}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {[r.branch, r.team].filter(Boolean).join(" • ") ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-[#1658E5]">
                      {r.distance_km} km
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.time_moving_label}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.idle_time_label}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.stops_count}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.check_in ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.check_out ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default TravelMonitoring;

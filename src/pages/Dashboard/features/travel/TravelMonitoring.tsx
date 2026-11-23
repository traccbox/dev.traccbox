import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { TravelFilters } from "@/api/mock/travel";
import { BRANCHES, EMPLOYEES, TEAMS } from "@/api/mock/orgData";
import { exportCSV } from "@/utils/exportData";
import {
  getTravelSummary,
  getTravelTrips,
  getTripRoute,
} from "@/api/travels/apiTravels";
import Spinner from "@/components/ui/Spinner";
import { TravelTrip } from "@/api/travels/types";

const PAGE_SIZE = 8;

const TravelMonitoring: React.FC = () => {
  const [filters, setFilters] = useState<TravelFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);

  const {
    data: travelSummary,
    isLoading: isGettingSummary,
    isError: isSummaryError,
    refetch,
  } = useQuery({
    queryKey: ["summary", filters, search],
    queryFn: () => getTravelSummary({ ...filters }),
  });

  const {
    data: travelTrips,
    isLoading: isGettingTrips,
    isError: isTripsError,
    // refetch: refetchTrips,
  } = useQuery({
    queryKey: ["trips", filters, search],
    queryFn: () => getTravelTrips({ ...filters }),
  });

  const {
    data: tripRoute,
    isLoading: isGettingRoute,
    isError: isRouteError,
  } = useQuery({
    queryKey: ["trip-route", selectedId],
    queryFn: () => getTripRoute(selectedId),
    enabled: Boolean(selectedId), // Only fetch when selectedId is not null
  });

  // useEffect(() => {
  //   if (!playing || !selected) return;
  //   const t = setInterval(() => {
  //     setPlayIndex((i) => {
  //       if (i >= selected.route.length - 1) {
  //         setPlaying(false);
  //         return i;
  //       }
  //       return i + 1;
  //     });
  //   }, 700);
  //   return () => clearInterval(t);
  // }, [playing, selected]);

  if (isGettingSummary || isGettingTrips) {
    return (
      <div className="w-full bg-slate-200 h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (isSummaryError || !travelSummary || isTripsError || !travelTrips) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Failed to load Travel Summary
          </h2>
        </div>
      </div>
    );
  }

  const rows = travelTrips?.data;
  const selected: TravelTrip | undefined =
    rows.find((r) => r.id === selectedId) ?? rows[0];

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const set = (k: keyof TravelFilters, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };

  console.log("tripRoute", tripRoute);
  console.log("travelTrips", travelTrips);

  const exportRows = rows.map((r) => ({
    Employee: r.employee,
    Date: r.date,
    "Distance (km)": r.distance_km,
    "Time Moving": r.time_moving_minutes,
    "Idle Time": r.idle_time_minutes,
    "Check-in": r.check_in,
    "Check-out": r.check_out,
    Branch: r.branch,
    Team: r.team,
  }));

  const summary = travelSummary.data;

  return (
    <div>
      <PageHeader
        title="Travel Monitoring"
        description="GPS movement analytics, routes and stop analysis for field reps."
        crumbs={[{ label: "Travel Monitoring" }]}
        actions={
          <button
            onClick={() => exportCSV(exportRows, "travel-monitoring.csv")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      {isSummaryError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isGettingSummary || !summary ? (
        <CardsSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            index={0}
            title="Distance Today"
            value={`${summary.distance_today_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
            percent={9}
          />
          <StatCard
            index={1}
            title="Distance This Week"
            value={`${summary.distance_week_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
            percent={4}
          />
          <StatCard
            index={2}
            title="Distance This Month"
            value={`${summary.distance_month_km} km`}
            icon={<RouteIcon className="w-4 h-4" />}
            percent={-2}
          />
          <StatCard
            index={3}
            title="Total Stops"
            value={summary.total_stops}
            icon={<MapPin className="w-4 h-4" />}
            percent={6}
          />
          <StatCard
            index={4}
            title="Moving Time"
            value={summary.moving_time_minutes}
            icon={<Clock className="w-4 h-4" />}
          />
          <StatCard
            index={5}
            title="Idle Time"
            value={summary.idle_time_minutes}
            icon={<TimerReset className="w-4 h-4" />}
          />
          <StatCard
            index={2}
            title="Average Speed"
            value={`${summary.average_speed_kmh} km/h`}
            icon={<Gauge className="w-4 h-4" />}
            percent={3}
          />
          <StatCard
            index={0}
            title="Tracked Trips"
            value={rows.length}
            icon={<RouteIcon className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="date"
          value={filters.date ?? ""}
          onChange={(e) => set("date", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={filters.employeeId ?? ""}
          onChange={(e) => set("employeeId", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700"
        >
          <option value="">All Employees</option>
          {EMPLOYEES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          value={filters.branch ?? ""}
          onChange={(e) => set("branch", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700"
        >
          <option value="">All Branches</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={filters.team ?? ""}
          onChange={(e) => set("team", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700"
        >
          <option value="">All Teams</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search employee…"
            className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Map + playback */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Route Playback
            </h2>
            <p className="text-[11px] text-gray-500">
              {selected
                ? `${selected.employee} • ${selected.date} • ${selected.distance_km} km`
                : "Select a trip from the table below"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={!selected}
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

        {selected ? (
          <>
            {isGettingRoute || isRouteError ? (
              <div className="text-center h-[200px] py-4">
                <Spinner />
              </div>
            ) : (
              <RouteMap
                route={tripRoute.data.points}
                playbackIndex={playIndex}
              />
            )}
            <input
              type="range"
              min={0}
              max={tripRoute.data.points.length - 1}
              value={playIndex}
              onChange={(e) => setPlayIndex(Number(e.target.value))}
              className="w-full mt-3 accent-[#1658E5]"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Start{" "}
                {tripRoute.data.points[0]?.time || "----"}
              </span>
              <span>
                Current: {tripRoute.data.points[playIndex]?.time || "----"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> End{" "}
                {tripRoute.data.points[tripRoute.data.points.length - 1]
                  ?.time || "----"}
              </span>
            </div>
          </>
        ) : (
          <EmptyState title="No route to display" />
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Trips</h2>
          <span className="text-xs text-gray-500">{rows.length} records</span>
        </div>
        {isGettingTrips ? (
          <TableSkeleton />
        ) : paged.length === 0 ? (
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
                {paged.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedId(r.id);
                      setPlayIndex(0);
                      setPlaying(false);
                    }}
                    className={`border-t border-gray-50 cursor-pointer transition-colors ${
                      selected?.id === r.id
                        ? "bg-blue-50/70"
                        : "hover:bg-blue-50/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={r.photo}
                          alt={r.employee}
                          className="w-7 h-7 rounded-full"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {r.employee}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {r.branch} • {r.team}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-[#1658E5]">
                      {r.distance_km} km
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.time_moving_minutes}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.idle_time_minutes}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.check_in}</td>
                    <td className="px-4 py-3 text-gray-700">{r.check_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default TravelMonitoring;

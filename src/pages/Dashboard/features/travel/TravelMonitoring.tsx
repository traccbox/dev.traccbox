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
import { CardsSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import RouteMap from "./RouteMap";
import { fetchTravelData, TravelFilters, TravelRow } from "@/api/mock/travel";
import { BRANCHES, EMPLOYEES, TEAMS } from "@/api/mock/orgData";
import { exportCSV } from "@/utils/exportData";

const PAGE_SIZE = 8;

const TravelMonitoring: React.FC = () => {
  const [filters, setFilters] = useState<TravelFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["travel", filters, search],
    queryFn: () => fetchTravelData({ ...filters, search }),
  });

  const rows = data?.rows ?? [];
  const selected: TravelRow | undefined = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0],
    [rows, selectedId],
  );

  useEffect(() => {
    if (!playing || !selected) return;
    const t = setInterval(() => {
      setPlayIndex((i) => {
        if (i >= selected.route.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [playing, selected]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const set = (k: keyof TravelFilters, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };

  const exportRows = rows.map((r) => ({
    Employee: r.employee,
    Date: r.date,
    "Distance (km)": r.distance,
    "Time Moving": r.timeMoving,
    "Idle Time": r.idleTime,
    "Check-in": r.checkIn,
    "Check-out": r.checkOut,
    Branch: r.branch,
    Team: r.team,
  }));

  const s = data?.summary;

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

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !s ? (
        <CardsSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard index={0} title="Distance Today" value={`${s.distanceToday} km`} icon={<RouteIcon className="w-4 h-4" />} percent={9} />
          <StatCard index={1} title="Distance This Week" value={`${s.distanceWeek} km`} icon={<RouteIcon className="w-4 h-4" />} percent={4} />
          <StatCard index={2} title="Distance This Month" value={`${s.distanceMonth} km`} icon={<RouteIcon className="w-4 h-4" />} percent={-2} />
          <StatCard index={3} title="Total Stops" value={s.totalStops} icon={<MapPin className="w-4 h-4" />} percent={6} />
          <StatCard index={4} title="Moving Time" value={s.movingTime} icon={<Clock className="w-4 h-4" />} />
          <StatCard index={5} title="Idle Time" value={s.idleTime} icon={<TimerReset className="w-4 h-4" />} />
          <StatCard index={2} title="Average Speed" value={`${s.averageSpeed} km/h`} icon={<Gauge className="w-4 h-4" />} percent={3} />
          <StatCard index={0} title="Tracked Trips" value={rows.length} icon={<RouteIcon className="w-4 h-4" />} />
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
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={filters.branch ?? ""}
          onChange={(e) => set("branch", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700"
        >
          <option value="">All Branches</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filters.team ?? ""}
          onChange={(e) => set("team", e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700"
        >
          <option value="">All Teams</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>{t}</option>
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
            <h2 className="text-sm font-semibold text-gray-900">Route Playback</h2>
            <p className="text-[11px] text-gray-500">
              {selected
                ? `${selected.employee} • ${selected.date} • ${selected.distance} km`
                : "Select a trip from the table below"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={!selected}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#1658E5] text-xs font-medium text-white disabled:opacity-40"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
            <RouteMap route={selected.route} playbackIndex={playIndex} />
            <input
              type="range"
              min={0}
              max={selected.route.length - 1}
              value={playIndex}
              onChange={(e) => setPlayIndex(Number(e.target.value))}
              className="w-full mt-3 accent-[#1658E5]"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Start{" "}
                {selected.route[0]?.time}
              </span>
              <span>Current: {selected.route[playIndex]?.time}</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> End{" "}
                {selected.route[selected.route.length - 1]?.time}
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
        {isLoading ? (
          <TableSkeleton />
        ) : paged.length === 0 ? (
          <EmptyState title="No trips found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {["Employee", "Date", "Distance", "Time Moving", "Idle Time", "Check-in", "Check-out"].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
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
                      selected?.id === r.id ? "bg-blue-50/70" : "hover:bg-blue-50/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={r.photo} alt={r.employee} className="w-7 h-7 rounded-full" loading="lazy" />
                        <div>
                          <p className="font-medium text-gray-900">{r.employee}</p>
                          <p className="text-[10px] text-gray-400">{r.branch} • {r.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-[#1658E5]">{r.distance} km</td>
                    <td className="px-4 py-3 text-gray-700">{r.timeMoving}</td>
                    <td className="px-4 py-3 text-gray-700">{r.idleTime}</td>
                    <td className="px-4 py-3 text-gray-700">{r.checkIn}</td>
                    <td className="px-4 py-3 text-gray-700">{r.checkOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
};

export default TravelMonitoring;

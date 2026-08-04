import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Download,
  FileText,
  MapPin,
  Search,
  Smartphone,
  Filter,
  RotateCw,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/dashboard/Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import {
  ACTIVITY_TYPES,
  fetchPerformanceLogs,
  LogFilters,
  PerformanceLog,
} from "@/api/mock/performanceLogs";
import {
  BRANCHES,
  DEPARTMENTS,
  EMPLOYEES,
  TEAMS,
  TERRITORIES,
} from "@/api/mock/orgData";
import { exportCSV, exportPDF } from "@/utils/exportData";

const PAGE_SIZE = 8;

const statusStyles: Record<PerformanceLog["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Flagged: "bg-rose-50 text-rose-700 border-rose-100",
};

const activityColor = (a: string) => {
  if (a.includes("Check In") || a.includes("Route Started")) return "bg-blue-500";
  if (a.includes("Check Out") || a.includes("Route Ended")) return "bg-indigo-500";
  if (a.includes("Order")) return "bg-emerald-500";
  if (a.includes("Task")) return "bg-teal-500";
  if (a.includes("Image")) return "bg-amber-500";
  return "bg-gray-400";
};

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
}> = ({ value, onChange, placeholder, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
  >
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const PerformanceLogs: React.FC = () => {
  const [filters, setFilters] = useState<LogFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["performance-logs", filters, search],
    queryFn: () => fetchPerformanceLogs({ ...filters, search }),
  });

  const logs = data ?? [];
  const paged = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page],
  );

  const set = (k: keyof LogFilters, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };

  const exportRows = logs.map((l) => ({
    Employee: l.employeeName,
    Activity: l.activity,
    Time: new Date(l.time).toLocaleString(),
    Location: l.gps.address,
    GPS: `${l.gps.lat.toFixed(4)}, ${l.gps.lng.toFixed(4)}`,
    Branch: l.branch,
    Department: l.department,
    Status: l.status,
    Device: l.device,
  }));

  return (
    <div>
      <PageHeader
        title="Performance Logs"
        description="Timeline of every field activity captured across your teams."
        crumbs={[{ label: "Performance" }, { label: "Performance Logs" }]}
        actions={
          <>
            <button
              onClick={() => exportCSV(exportRows, "performance-logs.csv")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => exportPDF("Performance Logs", exportRows)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-[#1658E5]" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <input
            type="date"
            value={filters.date ?? ""}
            onChange={(e) => set("date", e.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <Select
            value={filters.employeeId ?? ""}
            onChange={(v) => set("employeeId", v)}
            placeholder="All Employees"
            options={EMPLOYEES.map((e) => ({ label: e.name, value: e.id }))}
          />
          <Select
            value={filters.department ?? ""}
            onChange={(v) => set("department", v)}
            placeholder="All Departments"
            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
          />
          <Select
            value={filters.branch ?? ""}
            onChange={(v) => set("branch", v)}
            placeholder="All Branches"
            options={BRANCHES.map((d) => ({ label: d, value: d }))}
          />
          <Select
            value={filters.team ?? ""}
            onChange={(v) => set("team", v)}
            placeholder="All Teams"
            options={TEAMS.map((d) => ({ label: d, value: d }))}
          />
          <Select
            value={filters.territory ?? ""}
            onChange={(v) => set("territory", v)}
            placeholder="All Territories"
            options={TERRITORIES.map((d) => ({ label: d, value: d }))}
          />
          <Select
            value={filters.activity ?? ""}
            onChange={(v) => set("activity", v)}
            placeholder="All Activities"
            options={ACTIVITY_TYPES.map((d) => ({ label: d, value: d }))}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search employee, activity or location…"
              className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={() => {
              setFilters({});
              setSearch("");
              setPage(1);
            }}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RotateCw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1658E5]" /> Activity Timeline
          </h2>
          <span className="text-xs text-gray-500">{logs.length} activities</span>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : paged.length === 0 ? (
          <EmptyState title="No activities found" />
        ) : (
          <div className="p-4 md:p-6">
            <ol className="relative border-l border-gray-100 ml-3 space-y-4">
              {paged.map((log) => (
                <li key={log.id} className="ml-6">
                  <span
                    className={`absolute -left-[7px] mt-5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${activityColor(
                      log.activity,
                    )}`}
                  />
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <img
                        src={log.employeePhoto}
                        alt={log.employeeName}
                        className="w-11 h-11 rounded-full object-cover border border-gray-100"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {log.employeeName}
                          </p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#1658E5] font-medium">
                            {log.activity}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                              statusStyles[log.status]
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {log.gps.address} ({log.gps.lat.toFixed(4)},{" "}
                            {log.gps.lng.toFixed(4)})
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {log.branch}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" /> {log.device}
                          </span>
                        </div>
                        {log.note && (
                          <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            {log.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-gray-900">
                          {new Date(log.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(log.time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isLoading && !isError && logs.length > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={logs.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default PerformanceLogs;

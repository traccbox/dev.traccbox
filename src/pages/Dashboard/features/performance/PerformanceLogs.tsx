import React, { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/dashboard/States";
import {
  getPerformanceFilters,
  getPerformanceLogs,
  getPerformanceLogsSummary,
} from "@/api/performance-logs/apiPerformance";
import {
  GetPerformanceLogsParams,
  PerformanceLog,
} from "@/api/performance-logs/types";
import { downloadPerformanceReport } from "@/utils/performanceUtils";
import { useDebounce } from "@/hooks/useDebounce";
import GenericReportView from "./GenericReportView";
import LogDetailModal from "./LogDetailModal";

const PAGE_SIZE = 10;
const EXPORT_LIMIT = 100; // API max per_page

type LogFilterValues = Pick<
  GetPerformanceLogsParams,
  | "start_date"
  | "end_date"
  | "employee_id"
  | "department"
  | "branch"
  | "team"
  | "activity"
  | "status"
>;

const statusStyle = (status: PerformanceLog["status"]) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "flagged":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-600 border-gray-100";
  }
};

const activityColor = (a: string) => {
  if (a.includes("Check In") || a.includes("Route Started"))
    return "bg-blue-500";
  if (a.includes("Check Out") || a.includes("Route Ended"))
    return "bg-indigo-500";
  if (a.includes("Order")) return "bg-emerald-500";
  if (a.includes("Task")) return "bg-teal-500";
  if (a.includes("Image")) return "bg-amber-500";
  return "bg-gray-400";
};

const inputClass =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100";

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
}> = ({ value, onChange, placeholder, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={inputClass}
  >
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const toOptions = (list: string[] | undefined) =>
  (list ?? []).map((v) => ({ label: v, value: v }));

const PerformanceLogs: React.FC = () => {
  const [filters, setFilters] = useState<LogFilterValues>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 400);
  const [page, setPage] = useState(1);
  const [openLogId, setOpenLogId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const listParams: GetPerformanceLogsParams = {
    ...filters,
    search: search || undefined,
  };

  // Filter options (GET /performance/logs/filters)
  const { data: filterData } = useQuery({
    queryKey: ["performance-filters"],
    queryFn: getPerformanceFilters,
    staleTime: 5 * 60 * 1000,
  });
  const filterLogs = filterData?.data;

  // Logs (GET /performance/logs): server-side filter / search / paging
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["performance-logs", listParams, page],
    queryFn: () =>
      getPerformanceLogs({ ...listParams, page, per_page: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  // Summary for the same filters (GET /performance/logs/summary)
  const { data: summaryData } = useQuery({
    queryKey: ["performance-logs-summary", listParams],
    queryFn: () => getPerformanceLogsSummary(listParams),
    placeholderData: keepPreviousData,
  });
  // Tiles only: drop any raw arrays the summary might include
  const summaryTiles = Object.fromEntries(
    Object.entries(summaryData?.data ?? {}).filter(
      ([, v]) => !Array.isArray(v),
    ),
  );

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? logs.length;

  const set = (k: keyof LogFilterValues, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };
  const hasActiveFilters =
    Object.values(filters).some(Boolean) || searchInput !== "";

  // Export everything matching the filters (API max 100), not just this page
  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      const res = await getPerformanceLogs({
        ...listParams,
        page: 1,
        per_page: EXPORT_LIMIT,
      });
      downloadPerformanceReport(res.data, format);
    } catch (err) {
      console.error("Performance logs export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Performance Logs"
        description="Timeline of every field activity captured across your teams."
        crumbs={[{ label: "Performance" }, { label: "Performance Logs" }]}
        actions={
          <>
            <button
              onClick={() => handleExport("csv")}
              disabled={!!exporting || total === 0}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              {exporting === "csv" ? "Exporting…" : "Export CSV"}
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!exporting || total === 0}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd] disabled:opacity-40"
            >
              <FileText className="w-4 h-4" />
              {exporting === "pdf" ? "Exporting…" : "Export PDF"}
            </button>
          </>
        }
      />

      {/* Summary (GET /performance/logs/summary) */}
      {Object.keys(summaryTiles).length > 0 && (
        <div className="mb-6">
          <GenericReportView data={summaryTiles} />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-[#1658E5]" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="date"
            aria-label="From date"
            value={filters.start_date ?? ""}
            max={filters.end_date}
            onChange={(e) => set("start_date", e.target.value)}
            className={inputClass}
          />
          <input
            type="date"
            aria-label="To date"
            value={filters.end_date ?? ""}
            min={filters.start_date}
            onChange={(e) => set("end_date", e.target.value)}
            className={inputClass}
          />
          <Select
            value={filters.employee_id ?? ""}
            onChange={(v) => set("employee_id", v)}
            placeholder="All Employees"
            options={(filterLogs?.employees ?? []).map((e) => ({
              label: e.name,
              value: e.id,
            }))}
          />
          <Select
            value={filters.department ?? ""}
            onChange={(v) => set("department", v)}
            placeholder="All Departments"
            options={toOptions(filterLogs?.departments)}
          />
          <Select
            value={filters.branch ?? ""}
            onChange={(v) => set("branch", v)}
            placeholder="All Branches"
            options={toOptions(filterLogs?.branches)}
          />
          <Select
            value={filters.team ?? ""}
            onChange={(v) => set("team", v)}
            placeholder="All Teams"
            options={toOptions(filterLogs?.teams)}
          />
          <Select
            value={filters.activity ?? ""}
            onChange={(v) => set("activity", v)}
            placeholder="All Activities"
            options={toOptions(filterLogs?.activities)}
          />
          <Select
            value={filters.status ?? ""}
            onChange={(v) => set("status", v)}
            placeholder="All Statuses"
            options={toOptions(filterLogs?.statuses)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search employee, activity or location…"
              className={`${inputClass} w-full pl-9 pr-3`}
            />
          </div>
          <button
            onClick={() => {
              setFilters({});
              setSearchInput("");
              setPage(1);
            }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
          <span className="text-xs text-gray-500">{total} activities</span>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : logs.length === 0 ? (
          <EmptyState title="No activities found" />
        ) : (
          <div className="p-4 md:p-6">
            <ol className="relative border-l border-gray-100 ml-3 space-y-4">
              {logs.map((log) => (
                <li key={log.id} className="ml-6">
                  <span
                    className={`absolute -left-[7px] mt-5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${activityColor(
                      log.activity,
                    )}`}
                  />
                  <button
                    type="button"
                    onClick={() => setOpenLogId(log.id)}
                    className="block w-full text-left rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <img
                        src={log.employee_photo || "/users.png"}
                        alt={log.employee_name}
                        className="w-11 h-11 rounded-full object-cover border border-gray-100"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {log.employee_name}
                          </p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#1658E5] font-medium">
                            {log.activity}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusStyle(
                              log.status,
                            )}`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {log.gps || "---"}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                            {log.branch || "---"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" />{" "}
                            {log.device || "---"}
                          </span>
                        </div>
                        {log.flag_reason && (
                          <p className="mt-2 text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">
                            Flagged: {log.flag_reason}
                          </p>
                        )}
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
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isError && total > 0 && (
          <Pagination
            page={page}
            pageSize={data?.meta?.per_page || PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        )}
      </div>

      {openLogId && (
        <LogDetailModal
          logId={openLogId}
          statuses={filterLogs?.statuses}
          onClose={() => setOpenLogId(null)}
        />
      )}
    </div>
  );
};

export default PerformanceLogs;

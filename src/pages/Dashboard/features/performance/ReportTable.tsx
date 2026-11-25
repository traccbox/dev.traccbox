import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPerformanceReportTable } from "@/api/performance-logs/apiPerformance";
import {
  PerformanceReportType,
  PeriodType,
} from "@/api/performance-logs/types";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/dashboard/States";
import Pagination from "@/components/dashboard/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import EmployeeReportModal from "./EmployeeReportModal";
import { prettyKey } from "./GenericReportView";

export type TableKey = PerformanceReportType;

const TABS: { key: TableKey; label: string }[] = [
  { key: "employee", label: "Employee Report" },
  { key: "branch", label: "Branch Report" },
  { key: "team", label: "Team Report" },
];

const PAGE_SIZE = 10;

interface Props {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
  org?: {
    department?: string;
    branch?: string;
    team?: string;
    employee_id?: string;
  };
}

type Row = Record<string, unknown>;

export default function ReportTable({ period, startDate, endDate, org }: Props) {
  const [tab, setTab] = useState<TableKey>("employee");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openEmployee, setOpenEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 250);

  const params = {
    period,
    start_date: startDate,
    end_date: endDate,
    ...org,
    page,
    per_page: PAGE_SIZE,
  };

  // Back to page 1 whenever the report itself changes
  useEffect(() => {
    setPage(1);
  }, [tab, period, startDate, endDate, org?.department, org?.branch, org?.team, org?.employee_id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-table", tab, params],
    queryFn: () => getPerformanceReportTable(tab, params),
    placeholderData: keepPreviousData,
  });

  // The API returns { data: [...rows], meta }
  const apiRows: Row[] = Array.isArray(data?.data)
    ? (data.data as unknown as Row[])
    : [];
  const total = data?.meta?.total ?? apiRows.length;

  // The report endpoints take no search param, so this filters the current page
  const rows = debouncedSearch
    ? apiRows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(debouncedSearch),
        ),
      )
    : apiRows;

  // employee_id is only used for the drill-down, not shown as a column
  const columns = Array.from(
    new Set(apiRows.flatMap((r) => Object.keys(r))),
  ).filter((c) => c !== "employee_id");

  const fmt = (v: unknown) =>
    v === null || v === undefined || v === ""
      ? "—"
      : typeof v === "number" && !Number.isInteger(v)
        ? v.toFixed(2)
        : String(v);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 h-9 rounded-lg text-xs font-medium ${
                tab === t.key
                  ? "bg-blue-50 text-[#1658E5]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this page…"
          className="h-9 w-full lg:w-64 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState title="No report data for this period" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {columns.map((h) => (
                  <th
                    key={h}
                    className="text-left font-medium px-4 py-3 whitespace-nowrap"
                  >
                    {prettyKey(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const employeeId =
                  tab === "employee" && typeof r.employee_id === "string"
                    ? r.employee_id
                    : null;
                return (
                  <tr
                    key={i}
                    onClick={() =>
                      employeeId &&
                      setOpenEmployee({
                        id: employeeId,
                        name: String(r.employee ?? "Employee"),
                      })
                    }
                    className={`border-t border-gray-50 transition-colors hover:bg-blue-50/40 ${
                      employeeId ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((c) => (
                      <td
                        key={c}
                        className="px-4 py-3 text-gray-700 whitespace-nowrap"
                      >
                        {fmt(r[c])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "employee" && rows.length > 0 && (
        <p className="px-4 pb-2 text-[11px] text-gray-400">
          Click an employee to open their full report.
        </p>
      )}

      {!isError && total > 0 && (
        <Pagination
          page={page}
          pageSize={data?.meta?.per_page || PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      )}

      {openEmployee && (
        <EmployeeReportModal
          employeeId={openEmployee.id}
          name={openEmployee.name}
          params={{ period, start_date: startDate, end_date: endDate }}
          onClose={() => setOpenEmployee(null)}
        />
      )}
    </div>
  );
}

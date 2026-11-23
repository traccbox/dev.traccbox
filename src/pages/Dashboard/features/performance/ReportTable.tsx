import { getPerformanceReportTable } from "@/api/performance-logs/apiPerformance";
import { EmptyState } from "@/components/dashboard/States";
import Spinner from "@/components/ui/Spinner";
import { Tabs } from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PeriodType } from "./Reports";
import { useDebounce } from "@/hooks/useDebounce";

export type TableKey = "employee" | "branch" | "team";

const TABS: { key: TableKey; label: string }[] = [
  { key: "employee", label: "Employee Report" },
  { key: "branch", label: "Branch Report" },
  { key: "team", label: "Team Report" },
  //   { key: "territory", label: "Territory Report" },
];

export default function ReportTable({ period }: { period: PeriodType }) {
  const [tab, setTab] = useState<TableKey>("employee");

  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-table", period, tab, debouncedSearch],
    queryFn: () =>
      getPerformanceReportTable(tab, {
        period: period,
        // search: debouncedSearch,
        page: 1,
        per_page: 25,
      }),
  });

  if (isLoading) {
    return (
      <div className="w-full bg-slate-200 h-[40vh] mt-10 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Failed to load performance logs
          </h2>
        </div>
      </div>
    );
  }

  const rows = (data?.[tab] ?? []).filter((r) =>
    search
      ? Object.values(r).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase()),
        )
      : true,
  );
  return (
    <div className="rounded-2xl bg-white border  border-gray-100 shadow-sm">
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
          placeholder="Search report…"
          className="h-9 w-full lg:w-64 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {Object.keys(rows[0] ?? {}).map((h) => (
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Tabs.length}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-50 hover:bg-blue-50/40 transition-colors"
                >
                  {Object.values(r).map((v, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 text-gray-700 whitespace-nowrap"
                    >
                      {String(v)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Printer,
  Route,
  ShoppingCart,
  UserCheck,
  Users,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/dashboard/States";
import {
  exportCSV,
  exportExcel,
  exportPDF,
  printHTML,
  tableHTML,
} from "@/utils/exportData";
import {
  getPerformanceFilters,
  getPerformanceReport,
} from "@/api/performance-logs/apiPerformance";
import {
  GetPerformanceReportParams,
  PeriodType,
} from "@/api/performance-logs/types";
import ReportTable from "./ReportTable";
import { downloadMonthlyWeeklyReport } from "@/utils/performanceUtils";

const COLORS = [
  "#1658E5",
  "#4F46E5",
  "#0EA5A5",
  "#F59E0B",
  "#E11D48",
  "#8B5CF6",
];

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
    </div>
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  </div>
);

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(16,24,40,.08)",
};

export type { PeriodType };

const PERIODS: PeriodType[] = ["daily", "weekly", "monthly", "custom"];

const fieldClass =
  "h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700";

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [org, setOrg] = useState<{
    department?: string;
    branch?: string;
    team?: string;
    employee_id?: string;
  }>({});

  const { data: filterData } = useQuery({
    queryKey: ["performance-filters"],
    queryFn: getPerformanceFilters,
    staleTime: 5 * 60 * 1000,
  });
  const filterOpts = filterData?.data;

  // "custom" needs both dates before the API can be called
  const customReady = period !== "custom" || (!!startDate && !!endDate);
  const reportParams: GetPerformanceReportParams = {
    period,
    ...(period === "custom"
      ? { start_date: startDate, end_date: endDate }
      : {}),
    ...org,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", reportParams],
    queryFn: () => getPerformanceReport(reportParams),
    enabled: customReady,
    placeholderData: keepPreviousData,
  });

  const setOrgFilter = (k: keyof typeof org, v: string) =>
    setOrg((o) => ({ ...o, [k]: v || undefined }));

  const s = data?.data?.summary;
  const others = data?.data;

  const printSummary = () => {
    if (!s) return;
    printHTML(
      "TraccBox Performance Report",
      tableHTML([
        {
          "Total Employees": s.total_employees,
          "Attendance Rate": `${s.attendance_rate}%`,
          "Active Employees": s.active_employees,
          "Customer Visits": s.customer_visits,
          "Orders Created": s.orders_created,
          "Tasks Completed": s.tasks_completed,
          "Distance (km)": s.distance_covered_km,
          "Working Hours": s.working_hours,
          "Productivity Score": s.productivity_score,
        },
      ]),
    );
  };

  return (
    <div>
      <PageHeader
        title="Weekly & Monthly Reports"
        description="Aggregated attendance, activity and productivity analytics."
        crumbs={[{ label: "Performance" }, { label: "Reports" }]}
        actions={
          <>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 h-8 rounded-md text-xs font-medium capitalize ${
                    period === p
                      ? "bg-[#1658E5] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              disabled={!others}
              onClick={() =>
                others && downloadMonthlyWeeklyReport(others, period, "pdf")
              }
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>

            <button
              disabled={!others}
              onClick={() =>
                others && downloadMonthlyWeeklyReport(others, period, "csv")
              }
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={printSummary}
              disabled={!s}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
        {period === "custom" && (
          <>
            <input
              type="date"
              aria-label="From date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldClass}
            />
            <input
              type="date"
              aria-label="To date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={fieldClass}
            />
          </>
        )}
        {(
          [
            ["department", "All Departments", filterOpts?.departments],
            ["branch", "All Branches", filterOpts?.branches],
            ["team", "All Teams", filterOpts?.teams],
          ] as const
        ).map(([key, label, list]) => (
          <select
            key={key}
            value={org[key] ?? ""}
            onChange={(e) => setOrgFilter(key, e.target.value)}
            className={fieldClass}
          >
            <option value="">{label}</option>
            {(list ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ))}
        <select
          value={org.employee_id ?? ""}
          onChange={(e) => setOrgFilter("employee_id", e.target.value)}
          className={fieldClass}
        >
          <option value="">All Employees</option>
          {(filterOpts?.employees ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {Object.values(org).some(Boolean) && (
          <button
            onClick={() => setOrg({})}
            className="h-9 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {!customReady ? (
        <EmptyState
          title="Pick a date range"
          message="Choose a start and end date to run a custom report."
        />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !s ? (
        <CardsSkeleton count={8} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <StatCard
              index={0}
              title="Total Employees"
              value={s.total_employees}
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              index={1}
              title="Attendance Rate"
              value={`${s.attendance_rate}%`}
              icon={<CalendarCheck className="w-4 h-4" />}
            />
            <StatCard
              index={2}
              title="Active Employees"
              value={s.active_employees}
              icon={<UserCheck className="w-4 h-4" />}
            />
            <StatCard
              index={3}
              title="Customer Visits"
              value={s.customer_visits}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              index={4}
              title="Orders Created"
              value={s.orders_created}
              icon={<ShoppingCart className="w-4 h-4" />}
            />
            <StatCard
              index={5}
              title="Tasks Completed"
              value={s.tasks_completed}
              icon={<ClipboardCheck className="w-4 h-4" />}
            />
            <StatCard
              index={2}
              title="Distance Covered"
              value={`${s.distance_covered_km} km`}
              icon={<Route className="w-4 h-4" />}
            />
            <StatCard
              index={1}
              title="Working Hours"
              value={`${s.working_hours}h`}
              icon={<Clock className="w-4 h-4" />}
            />
            <StatCard
              index={0}
              title="Productivity Score"
              value={`${s.productivity_score}/100`}
              icon={<Gauge className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <ChartCard
              title="Daily Attendance"
              subtitle="Present vs absent vs late"
            >
              {!others?.daily_attendance?.length ? (
                <EmptyState
                  title="No attendance data yet"
                  message="No attendance records for this period"
                />
              ) : (
                <BarChart data={others?.daily_attendance ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="present" fill="#1658E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="late" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" fill="#E11D48" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartCard>

            <ChartCard
              title="Weekly Performance"
              subtitle="Visits, orders and tasks per week"
            >
              {(others?.weekly_performance ?? []).length === 0 ? (
                <EmptyState
                  title="No weekly performance data"
                  message="No performance data available for the selected period"
                />
              ) : (
                <AreaChart data={others?.weekly_performance ?? []}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1658E5" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#1658E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="go" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5A5" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0EA5A5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#1658E5"
                    fill="url(#gv)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#0EA5A5"
                    fill="url(#go)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="#8B5CF6"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ChartCard>

            <ChartCard
              title="Monthly Performance"
              subtitle="Trend across the year"
            >
              {(others?.monthly_performance ?? []).length === 0 ? (
                <EmptyState
                  title="No monthly performance data"
                  message="No monthly performance records available yet"
                />
              ) : (
                <LineChart data={others?.monthly_performance ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#1658E5"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    stroke="#0EA5A5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ChartCard>

            <ChartCard
              title="Employee Comparison"
              subtitle="Productivity score by rep"
            >
              {(others?.employee_comparison ?? []).length === 0 ? (
                <EmptyState
                  title="No employee data yet"
                  message="No employee performance data to compare"
                />
              ) : (
                <BarChart
                  data={others?.employee_comparison ?? []}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {(others?.employee_comparison ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartCard>

            <ChartCard
              title="Branch Comparison"
              subtitle="Orders and visits per branch"
            >
              {(others?.branch_comparison ?? []).length === 0 ? (
                <EmptyState
                  title="No branch data yet"
                  message="No branch performance data available for this period"
                />
              ) : (
                <BarChart data={others?.branch_comparison ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="branch"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" fill="#1658E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="visits" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartCard>

            <ChartCard
              title="Team Performance"
              subtitle="Composite score by team"
            >
              {(others?.team_performance ?? []).length === 0 ? (
                <EmptyState
                  title="No team performance data"
                  message="No team performance records available yet"
                />
              ) : (
                <RadarChart data={others?.team_performance ?? []} outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Radar
                    dataKey="score"
                    stroke="#1658E5"
                    fill="#1658E5"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              )}
            </ChartCard>
          </div>

          {/* Report tables */}
          <ReportTable
            period={period}
            startDate={period === "custom" ? startDate : undefined}
            endDate={period === "custom" ? endDate : undefined}
            org={org}
          />
        </>
      )}
    </div>
  );
};

export default Reports;

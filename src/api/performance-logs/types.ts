// api/performance/typesPerformance.ts

export type PeriodType = "daily" | "weekly" | "monthly" | "custom";

export interface PerformanceLog {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_photo: string | null;
  activity: string;
  time: string;
  gps: string | null;
  branch: string | null;
  department: string | null;
  team: string | null;
  status: string;
  flag_reason: string | null;
  device: string | null;
  note: string | null;
  attachments: string[];
}

export interface PerformanceLogsMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface GetPerformanceLogsResponse {
  status: string;
  data: PerformanceLog[];
  meta: PerformanceLogsMeta;
}

export interface GetPerformanceLogsParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  department?: string;
  branch?: string;
  team?: string;
  activity?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort?: string;
}

export interface PerformanceLogFilterEmployee {
  id: string;
  name: string;
  photo: string | null;
}

export interface PerformanceLogFilters {
  employees: PerformanceLogFilterEmployee[];
  departments: string[];
  branches: string[];
  teams: string[];
  activities: string[];
  statuses: string[];
}

export interface GetPerformanceFiltersResponse {
  status: string;
  data: PerformanceLogFilters;
}

export interface PerformanceReportSummary {
  total_employees: number;
  attendance_rate: number;
  active_employees: number;
  customer_visits: number;
  orders_created: number;
  tasks_completed: number;
  distance_covered_km: number;
  working_hours: number;
  productivity_score: number;
}

export interface DailyAttendance {
  label: string;
  present: number;
  absent: number;
  late: number;
}

export interface WeeklyPerformance {
  label: string;
  visits: number;
  orders: number;
  tasks: number;
}

export interface MonthlyPerformance {
  label: string;
  visits: number;
  orders: number;
  tasks: number;
}

export interface EmployeeComparison {
  label: string;
  score: number;
  visits: number;
}

export interface BranchComparison {
  branch: string;
  employees: number;
  visits: number;
  orders: number;
  distance_km: number;
  attendance_percent: number;
}

export interface TeamPerformance {
  label: string;
  score: number;
}

export interface PerformanceReportData {
  summary: PerformanceReportSummary;
  daily_attendance: DailyAttendance[];
  weekly_performance: WeeklyPerformance[];
  monthly_performance: MonthlyPerformance[];
  employee_comparison: EmployeeComparison[];
  branch_comparison: BranchComparison[];
  team_performance: TeamPerformance[];
}

export interface GetPerformanceReportResponse {
  status: string;
  data: PerformanceReportData;
}

export interface GetPerformanceReportParams {
  period: PeriodType;
  start_date?: string;
  end_date?: string;
  branch?: string;
  team?: string;
  department?: string;
  employee_id?: string;
}

export type PerformanceReportType = "employee" | "branch" | "team";

export interface PerformanceReportTableParams {
  period: PeriodType;
  start_date?: string;
  end_date?: string;
  branch?: string;
  team?: string;
  department?: string;
  employee_id?: string;
  page?: number;
  per_page?: number;
}

export interface PerformanceReportTableMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface EmployeePerformanceReportRow {
  employee_id: string | null;
  employee: string;
  visits: number;
  score: number;
}

export interface BranchPerformanceReportRow {
  branch: string;
  employees: number;
  visits: number;
  orders: number;
  distance_km: number;
  attendance_percent: number;
}

export interface TeamPerformanceReportRow {
  label: string;
  score: number;
}

export interface PerformanceReportTableResponse<T> {
  status: string;
  data: T[];
  meta: PerformanceReportTableMeta;
}

export type PerformanceReportRowMap = {
  employee: EmployeePerformanceReportRow;
  branch: BranchPerformanceReportRow;
  team: TeamPerformanceReportRow;
};

// ─── Logs summary: GET /performance/logs/summary ────────────────────────────
// Same filters as the logs list (no paging). The docs have no response schema,
// so `data` is kept loose and rendered generically by the page.

export type GetPerformanceLogsSummaryParams = Omit<
  GetPerformanceLogsParams,
  "page" | "per_page" | "sort"
>;

export interface GetPerformanceLogsSummaryResponse {
  status: string;
  data: Record<string, unknown>;
}

// ─── Log detail: GET /performance/logs/{log_id} ─────────────────────────────

export interface GetPerformanceLogResponse {
  status: string;
  data: PerformanceLog;
}

// ─── Status update: PATCH /performance/logs/{log_id}/status ─────────────────
// Body schema (ActivityLogStatusUpdate) isn't in the docs. Assumed from the log
// fields: the new status plus an optional reason when flagging.

export interface PerformanceLogStatusUpdate {
  status: string;
  flag_reason?: string | null;
}

export interface UpdatePerformanceLogStatusResponse {
  status: string;
  data?: PerformanceLog;
}

// ─── Employee report: GET /performance/employees/{employee_id}/report ───────
// No response schema in the docs; rendered generically.

export interface GetEmployeeReportParams {
  period?: PeriodType;
  start_date?: string;
  end_date?: string;
}

export interface GetEmployeeReportResponse {
  status: string;
  data: Record<string, unknown>;
}

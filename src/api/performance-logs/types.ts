// api/performance/typesPerformance.ts

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
  period: "daily" | "weekly" | "monthly" | "custom";
  start_date?: string;
  end_date?: string;
  branch?: string;
  team?: string;
  department?: string;
  employee_id?: string;
}
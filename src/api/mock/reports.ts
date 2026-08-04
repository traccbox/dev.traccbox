import { BRANCHES, EMPLOYEES, TEAMS, TERRITORIES, delay, rand } from "./orgData";

export interface ReportSummary {
  totalEmployees: number;
  attendanceRate: number;
  activeEmployees: number;
  customerVisits: number;
  ordersCreated: number;
  tasksCompleted: number;
  distanceCovered: number;
  workingHours: number;
  productivityScore: number;
}

export interface SeriesPoint {
  label: string;
  [key: string]: string | number;
}

export interface ReportsPayload {
  summary: ReportSummary;
  dailyAttendance: SeriesPoint[];
  weeklyPerformance: SeriesPoint[];
  monthlyPerformance: SeriesPoint[];
  employeeComparison: SeriesPoint[];
  branchComparison: SeriesPoint[];
  teamPerformance: SeriesPoint[];
  employeeReport: Record<string, string | number>[];
  branchReport: Record<string, string | number>[];
  teamReport: Record<string, string | number>[];
  territoryReport: Record<string, string | number>[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function fetchReports(period: "weekly" | "monthly" = "weekly") {
  const s = period === "weekly" ? 3 : 11;
  const payload: ReportsPayload = {
    summary: {
      totalEmployees: EMPLOYEES.length,
      attendanceRate: 92 + (s % 5),
      activeEmployees: EMPLOYEES.length - 2,
      customerVisits: rand(s, 320, 780),
      ordersCreated: rand(s + 1, 140, 460),
      tasksCompleted: rand(s + 2, 200, 520),
      distanceCovered: rand(s + 3, 1200, 3800),
      workingHours: rand(s + 4, 700, 1900),
      productivityScore: rand(s + 5, 72, 95),
    },
    dailyAttendance: DAYS.map((d, i) => ({
      label: d,
      present: rand(i + s, 6, 12),
      absent: rand(i + s + 20, 0, 4),
      late: rand(i + s + 40, 0, 3),
    })),
    weeklyPerformance: WEEKS.map((w, i) => ({
      label: w,
      visits: rand(i + s, 60, 180),
      orders: rand(i + s + 5, 30, 120),
      tasks: rand(i + s + 9, 40, 140),
    })),
    monthlyPerformance: MONTHS.map((m, i) => ({
      label: m,
      visits: rand(i + s, 200, 700),
      orders: rand(i + s + 5, 120, 480),
      tasks: rand(i + s + 9, 150, 520),
    })),
    employeeComparison: EMPLOYEES.slice(0, 8).map((e, i) => ({
      label: e.name.split(" ")[0],
      score: rand(i + s, 55, 98),
      visits: rand(i + s + 2, 20, 90),
    })),
    branchComparison: BRANCHES.map((b, i) => ({
      label: b,
      orders: rand(i + s, 60, 240),
      visits: rand(i + s + 4, 80, 300),
    })),
    teamPerformance: TEAMS.map((t, i) => ({
      label: t,
      score: rand(i + s, 60, 97),
    })),
    employeeReport: EMPLOYEES.map((e, i) => ({
      Employee: e.name,
      Branch: e.branch,
      Team: e.team,
      Visits: rand(i + s, 12, 80),
      Orders: rand(i + s + 1, 5, 45),
      Tasks: rand(i + s + 2, 8, 60),
      "Distance (km)": rand(i + s + 3, 40, 320),
      "Attendance %": rand(i + s + 4, 78, 100),
      "Score": rand(i + s + 5, 60, 98),
    })),
    branchReport: BRANCHES.map((b, i) => ({
      Branch: b,
      Employees: rand(i + s, 4, 20),
      Visits: rand(i + s + 1, 80, 340),
      Orders: rand(i + s + 2, 40, 180),
      "Distance (km)": rand(i + s + 3, 300, 1400),
      "Attendance %": rand(i + s + 4, 80, 99),
    })),
    teamReport: TEAMS.map((t, i) => ({
      Team: t,
      Members: rand(i + s, 3, 9),
      Visits: rand(i + s + 1, 40, 220),
      Orders: rand(i + s + 2, 20, 130),
      "Tasks Completed": rand(i + s + 3, 30, 190),
      "Score": rand(i + s + 4, 60, 97),
    })),
    territoryReport: TERRITORIES.map((t, i) => ({
      Territory: t,
      "Assigned Reps": rand(i + s, 2, 8),
      Visits: rand(i + s + 1, 30, 190),
      Orders: rand(i + s + 2, 15, 110),
      Coverage: `${rand(i + s + 3, 55, 98)}%`,
    })),
  };
  return delay(payload);
}

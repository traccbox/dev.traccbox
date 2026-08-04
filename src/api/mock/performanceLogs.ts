import { EMPLOYEES, delay, rand } from "./orgData";

export const ACTIVITY_TYPES = [
  "Check In",
  "Check Out",
  "Customer Visit",
  "Order Created",
  "Task Completed",
  "Image Uploaded",
  "Route Started",
  "Route Ended",
  "Location Updated",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface PerformanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhoto: string;
  activity: ActivityType;
  time: string; // ISO
  gps: { lat: number; lng: number; address: string };
  branch: string;
  department: string;
  team: string;
  territory: string;
  status: "Completed" | "Pending" | "Flagged";
  device: string;
  note?: string;
}

const ADDRESSES = [
  "12 Adeola Odeku St, Victoria Island",
  "Allen Avenue, Ikeja",
  "Wuse II, Abuja",
  "Trans Amadi, Port Harcourt",
  "Lekki Phase 1, Lagos",
  "Ojota, Lagos",
];

const STATUSES: PerformanceLog["status"][] = ["Completed", "Pending", "Flagged"];

const LOGS: PerformanceLog[] = Array.from({ length: 96 }).map((_, i) => {
  const emp = EMPLOYEES[i % EMPLOYEES.length];
  const day = Math.floor(i / 12);
  const date = new Date();
  date.setDate(date.getDate() - day);
  date.setHours(8 + (i % 10), (i * 7) % 60, 0, 0);
  return {
    id: `log-${i + 1}`,
    employeeId: emp.id,
    employeeName: emp.name,
    employeePhoto: emp.photo,
    activity: ACTIVITY_TYPES[i % ACTIVITY_TYPES.length],
    time: date.toISOString(),
    gps: {
      lat: 6.4 + rand(i, 0, 900) / 10000,
      lng: 3.3 + rand(i + 3, 0, 900) / 10000,
      address: ADDRESSES[i % ADDRESSES.length],
    },
    branch: emp.branch,
    department: emp.department,
    team: emp.team,
    territory: emp.territory,
    status: STATUSES[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0],
    device: emp.device,
    note:
      i % 4 === 0 ? "Visit logged with customer signature and photo proof." : undefined,
  };
});

export interface LogFilters {
  date?: string;
  employeeId?: string;
  department?: string;
  branch?: string;
  team?: string;
  territory?: string;
  activity?: string;
  search?: string;
}

/** Placeholder service — swap for a real endpoint when the backend is ready. */
export async function fetchPerformanceLogs(filters: LogFilters = {}) {
  const rows = LOGS.filter((l) => {
    if (filters.date && !l.time.startsWith(filters.date)) return false;
    if (filters.employeeId && l.employeeId !== filters.employeeId) return false;
    if (filters.department && l.department !== filters.department) return false;
    if (filters.branch && l.branch !== filters.branch) return false;
    if (filters.team && l.team !== filters.team) return false;
    if (filters.territory && l.territory !== filters.territory) return false;
    if (filters.activity && l.activity !== filters.activity) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !l.employeeName.toLowerCase().includes(q) &&
        !l.activity.toLowerCase().includes(q) &&
        !l.gps.address.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  }).sort((a, b) => b.time.localeCompare(a.time));
  return delay(rows);
}

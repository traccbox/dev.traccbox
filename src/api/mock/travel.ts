import { EMPLOYEES, delay, rand } from "./orgData";

export interface TravelSummary {
  distanceToday: number;
  distanceWeek: number;
  distanceMonth: number;
  totalStops: number;
  movingTime: string;
  idleTime: string;
  averageSpeed: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  time: string;
  type?: "start" | "end" | "stop";
  label?: string;
}

export interface TravelRow {
  id: string;
  employeeId: string;
  employee: string;
  photo: string;
  branch: string;
  team: string;
  date: string;
  distance: number;
  timeMoving: string;
  idleTime: string;
  checkIn: string;
  checkOut: string;
  route: RoutePoint[];
}

function buildRoute(seed: number): RoutePoint[] {
  const pts: RoutePoint[] = [];
  let lat = 6.45 + rand(seed, 0, 300) / 10000;
  let lng = 3.39 + rand(seed + 2, 0, 300) / 10000;
  for (let i = 0; i < 10; i++) {
    lat += rand(seed + i * 3, -60, 90) / 10000;
    lng += rand(seed + i * 7, -60, 90) / 10000;
    const h = 8 + i;
    pts.push({
      lat,
      lng,
      time: `${String(h).padStart(2, "0")}:${String(rand(seed + i, 0, 59)).padStart(2, "0")}`,
      type: i === 0 ? "start" : i === 9 ? "end" : i % 3 === 0 ? "stop" : undefined,
      label: i % 3 === 0 ? `Stop ${Math.ceil(i / 3)}` : undefined,
    });
  }
  return pts;
}

const ROWS: TravelRow[] = Array.from({ length: 36 }).map((_, i) => {
  const emp = EMPLOYEES[i % EMPLOYEES.length];
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(i / 6));
  return {
    id: `trip-${i + 1}`,
    employeeId: emp.id,
    employee: emp.name,
    photo: emp.photo,
    branch: emp.branch,
    team: emp.team,
    date: d.toISOString().slice(0, 10),
    distance: rand(i, 12, 148),
    timeMoving: `${rand(i + 1, 2, 7)}h ${rand(i + 2, 0, 59)}m`,
    idleTime: `${rand(i + 3, 0, 2)}h ${rand(i + 4, 0, 59)}m`,
    checkIn: `0${rand(i + 5, 7, 9)}:${String(rand(i, 0, 59)).padStart(2, "0")}`,
    checkOut: `1${rand(i + 6, 5, 8)}:${String(rand(i + 1, 0, 59)).padStart(2, "0")}`,
    route: buildRoute(i + 1),
  };
});

export interface TravelFilters {
  date?: string;
  employeeId?: string;
  branch?: string;
  team?: string;
  search?: string;
}

export async function fetchTravelData(filters: TravelFilters = {}) {
  const rows = ROWS.filter((r) => {
    if (filters.date && r.date !== filters.date) return false;
    if (filters.employeeId && r.employeeId !== filters.employeeId) return false;
    if (filters.branch && r.branch !== filters.branch) return false;
    if (filters.team && r.team !== filters.team) return false;
    if (filters.search && !r.employee.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    return true;
  });

  const summary: TravelSummary = {
    distanceToday: 184,
    distanceWeek: 1246,
    distanceMonth: 4820,
    totalStops: 128,
    movingTime: "38h 20m",
    idleTime: "9h 05m",
    averageSpeed: 32,
  };

  return delay({ summary, rows });
}

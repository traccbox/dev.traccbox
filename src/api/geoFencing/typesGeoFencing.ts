export interface WorkAreaStats {
  total_areas: number;
  active_areas: number;
  inactive_areas: number;
  employees_assigned: number;
  employees_inside: number;
  violations_today: number;
}

export interface WorkArea {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  locations: WorkAreaLocation[];
  employee_count: number;
  inside_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkAreaMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface GetWorkAreasResponse {
  data: WorkArea[];
  meta: WorkAreaMeta;
}

export interface GetWorkAreasParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface WorkAreaLocation {
  name: string;
  method: string;
  boundary: {
    kind: "circle" | "polygon";
    center?: [number, number];
    radius?: number;
    coordinates?: [number, number][];
  };
  address?: string;
  country?: string;
  state?: string;
  lga?: string;
  ward?: string;
  community?: string;
  id?: string;
}

export interface WorkAreaRules {
  working_days: string[];
  working_hours: {
    start: string;
    end: string;
  };
  allow_clock_in: boolean;
  allow_clock_out: boolean;
  gps_accuracy: number;
  allow_offline: boolean;
  grace_period: number;
  auto_check_in: boolean;
  auto_check_out: boolean;
  entry_notification: boolean;
  exit_notification: boolean;
  violation_alerts: boolean;
}

export interface CreateWorkAreaPayload {
  name: string;
  description: string;
  type: string;
  status: "active" | "inactive";
  locations: WorkAreaLocation[];
  employee_ids: string[];
  rules: WorkAreaRules;
}

export interface CreateWorkAreaResponse {
  // id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "inactive";
  locations: WorkAreaLocation[];
  employee_count: number;
  inside_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkAreaEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  team: string | null;
  avatar: string | null;
  status: string;
}

export interface WorkAreaLocationResponse extends WorkAreaLocation {
  id: string;
}

export interface GetWorkAreaByIDResponse extends Omit<
  CreateWorkAreaPayload,
  "locations" | "employee_ids"
> {
  id: string;
  locations: WorkAreaLocationResponse[];
  rules: WorkAreaRules;
  employees: WorkAreaEmployee[];
  created_at: string;
  updated_at: string;
}

export type UpdateWorkAreaPayload = Partial<CreateWorkAreaPayload>;

export interface ToggleWorkAreaStatusPayload {
  status: "active" | "inactive";
}

/* ---------- Geo (administrative hierarchy + search) ---------- */

export interface GeoCountry {
  code: string;
  name: string;
  center?: [number, number];
  zoom?: number;
}

export interface GeoRegion {
  id: string;
  name: string;
  center?: [number, number];
  zoom?: number;
}

export interface GeoSearchResult {
  label: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface GeoListResponse<T> {
  data: T[];
}

/* ---------- Assignable employees ---------- */

export interface AssignableEmployee {
  id: string;
  name: string;
  role?: string | null;
  department?: string | null;
  team?: string | null;
  avatar?: string | null;
}

export interface GetAssignableEmployeesParams {
  search?: string;
  department?: string;
  team?: string;
  page?: number;
  limit?: number;
}

export interface GetAssignableEmployeesResponse {
  data: AssignableEmployee[];
  meta: { page: number; limit: number; total: number; total_pages?: number };
}

export interface AssignEmployeesResponse {
  assigned: number;
  employees: WorkAreaEmployee[];
}

/* ---------- Presence / attendance / violations ---------- */

export interface PresenceEmployee {
  id: string;
  name: string;
  status: "inside" | "near" | "outside" | "offline" | string;
  lat?: number | null;
  lng?: number | null;
  last_seen?: string | null;
}

export interface WorkAreaPresence {
  inside: number;
  near: number;
  outside: number;
  offline: number;
  employees: PresenceEmployee[];
}

export interface AttendanceDaily {
  date: string;
  check_ins: number;
  late: number;
  absent: number;
}

export interface WorkAreaAttendance {
  total_check_ins: number;
  total_check_outs: number;
  avg_hours: number;
  punctuality_rate: number;
  daily: AttendanceDaily[];
}

export interface WorkAreaViolation {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  occurred_at: string;
  lat?: number | null;
  lng?: number | null;
  resolved: boolean;
}

export interface GetViolationsResponse {
  data: WorkAreaViolation[];
  meta: WorkAreaMeta;
}

/* ---------- Location payloads ---------- */

export type CreateLocationPayload = Omit<WorkAreaLocation, "id">;
export type UpdateLocationPayload = Partial<CreateLocationPayload>;

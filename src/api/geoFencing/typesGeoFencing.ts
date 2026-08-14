export interface WorkAreaStats {
  total_areas: number;
  active_areas: number;
  inactive_areas: number;
  employees_assigned: number;
  employees_inside: number;
  violations_today: number;
}


// export interface WorkAreaLocation {
//   id: string;
//   name: string;
//   // Add other location fields when the API provides them
//   [key: string]: unknown;
// }

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
export interface TravelSummary {
  distance_today_km: number;
  distance_week_km: number;
  distance_month_km: number;
  total_stops: number;
  moving_time_minutes: number;
  moving_time_label: string;
  idle_time_minutes: number;
  idle_time_label: string;
  average_speed_kmh: number;
  max_speed_kmh: number;
  active_trips: number;
  employees_tracked: number;
}

export interface GetTravelSummaryResponse {
  status: string;
  data: TravelSummary;
}

export interface GetTravelSummaryParams {
  employee_id?: string;
  branch?: string;
  team?: string;
  department?: string;
}

// Travel Trip

export interface TravelTrip {
  id: string;
  employee_id: string;
  employee: string;
  photo: string | null;
  branch: string | null;
  team: string | null;
  date: string;
  distance_km: number;
  time_moving_minutes: number;
  time_moving_label: string;
  idle_time_minutes: number;
  idle_time_label: string;
  check_in: string | null;
  check_out: string | null;
  stops_count: number;
  average_speed_kmh: number;
  status: string;
}

export interface TravelTripsMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface GetTravelTripsResponse {
  status: string;
  data: TravelTrip[];
  meta: TravelTripsMeta;
}

export interface GetTravelTripsParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  branch?: string;
  team?: string;
  department?: string;
  min_distance?: number;
  max_distance?: number;
  search?: string;
  page?: number;
  per_page?: number;
  sort?: string;
}

// Get trip route

export interface TripRoutePoint {
  lat: number;
  lng: number;
  time: string;
  speed_kmh: number;
  accuracy_m: number;
  battery: number;
}

export interface TripRoute {
  trip_id: string;
  points: TripRoutePoint[];
}

export interface GetTripRouteResponse {
  status: string;
  data: TripRoute;
}

export interface GetTripRouteParams {
  from?: string; // HH:MM
  to?: string;   // HH:MM
}

// ─── Trip detail: GET /travel/trips/{trip_id} ───────────────────────────────

export interface GetTripResponse {
  status: string;
  data: TravelTrip;
}

// ─── Trip stops: GET /travel/trips/{trip_id}/stops ──────────────────────────
// The API docs have no response schema. These are normalised in apiTravels.ts,
// which accepts the common alternative field names.

export interface TripStop {
  lat: number;
  lng: number;
  arrived_at: string | null;
  departed_at: string | null;
  duration_minutes: number | null;
  label: string | null;
}

export interface TripStopsResult {
  trip_id: string;
  stops: TripStop[];
}

// ─── Trend: GET /travel/trend ───────────────────────────────────────────────

export type TravelGranularity = "daily" | "weekly" | "monthly";

export interface GetTravelTrendParams {
  granularity?: TravelGranularity;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  branch?: string;
  team?: string;
  department?: string;
}

export interface TravelTrendPoint {
  label: string;
  distance_km: number;
}

// ─── Live positions: GET /travel/live ───────────────────────────────────────

export interface GetLivePositionsParams {
  branch?: string;
  team?: string;
}

export interface LivePosition {
  employee_id: string;
  employee: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  updated_at: string | null;
  branch: string | null;
  team: string | null;
}

// ─── Filters: GET /travel/filters ───────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface TravelFilterOptions {
  employees: FilterOption[];
  branches: FilterOption[];
  teams: FilterOption[];
  departments: FilterOption[];
}

/** Filter values the dashboard sends to summary / trips / trend. */
export interface TravelFilterValues {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  branch?: string;
  team?: string;
  department?: string;
}

// ─── Employee trips: GET /travel/employees/{employee_id}/trips ──────────────

export interface GetEmployeeTripsParams {
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

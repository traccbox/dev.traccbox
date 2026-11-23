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

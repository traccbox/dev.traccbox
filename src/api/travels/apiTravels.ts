import api from "../AxiosInstance";
import {
  GetTravelSummaryParams,
  GetTravelSummaryResponse,
  GetTravelTripsParams,
  GetTravelTripsResponse,
  GetTripRouteParams,
  GetTripRouteResponse,
  GetTripResponse,
  TripStop,
  TripStopsResult,
  GetTravelTrendParams,
  TravelTrendPoint,
  GetLivePositionsParams,
  LivePosition,
  FilterOption,
  TravelFilterOptions,
  GetEmployeeTripsParams,
} from "./types";

export async function getTravelSummary(
  params?: GetTravelSummaryParams,
): Promise<GetTravelSummaryResponse> {
  const response = await api.get<GetTravelSummaryResponse>("/travel/summary", {
    params,
  });

  return response.data;
}

export async function getTravelTrips(
  params?: GetTravelTripsParams,
): Promise<GetTravelTripsResponse> {
  const response = await api.get<GetTravelTripsResponse>("/travel/trips", {
    params,
  });

  return response.data;
}

export async function getTripRoute(
  tripId: string,
  params?: GetTripRouteParams,
): Promise<GetTripRouteResponse> {
  const response = await api.get<GetTripRouteResponse>(
    `/travel/trips/${tripId}/route`,
    { params },
  );

  return response.data;
}

// ─── Response normalisers ───────────────────────────────────────────────────
// The API docs list no response schemas for the endpoints below, so these
// accept the likely shapes ({data: [...]}, {data: {key: [...]}}, bare arrays)
// and the common alternative field names, and never throw on unexpected data.

/* eslint-disable @typescript-eslint/no-explicit-any */
const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
  return undefined;
};

const asList = (payload: any, ...keys: string[]): any[] => {
  const d = payload?.data ?? payload;
  if (Array.isArray(d)) return d;
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
  return [];
};

const toOptions = (list: unknown): FilterOption[] =>
  (Array.isArray(list) ? list : [])
    .map((item: any): FilterOption | null => {
      if (typeof item === "string") return { value: item, label: item };
      const value = pick(item, "id", "value", "name", "label");
      if (value === undefined) return null;
      return {
        value: String(value),
        label: String(pick(item, "name", "label", "full_name", "id") ?? value),
      };
    })
    .filter((o): o is FilterOption => o !== null);

// ─── GET /travel/filters ────────────────────────────────────────────────────

export async function getTravelFilters(): Promise<TravelFilterOptions> {
  const response = await api.get("/travel/filters");
  const d = response.data?.data ?? response.data ?? {};
  return {
    employees: toOptions(d.employees),
    branches: toOptions(d.branches),
    teams: toOptions(d.teams),
    departments: toOptions(d.departments),
  };
}

// ─── GET /travel/trips/{trip_id} ────────────────────────────────────────────

export async function getTripDetail(tripId: string): Promise<GetTripResponse> {
  const response = await api.get<GetTripResponse>(`/travel/trips/${tripId}`);
  return response.data;
}

// ─── GET /travel/trips/{trip_id}/stops ──────────────────────────────────────

export async function getTripStops(tripId: string): Promise<TripStopsResult> {
  const response = await api.get(`/travel/trips/${tripId}/stops`);
  const stops = asList(response.data, "stops")
    .map((s: any): TripStop | null => {
      const lat = Number(pick(s, "lat", "latitude"));
      const lng = Number(pick(s, "lng", "lon", "longitude"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const duration = pick(s, "duration_minutes", "duration");
      return {
        lat,
        lng,
        arrived_at: pick(s, "arrived_at", "start_time", "arrival_time", "time") ?? null,
        departed_at: pick(s, "departed_at", "end_time", "departure_time") ?? null,
        duration_minutes: duration === undefined ? null : Number(duration),
        label: pick(s, "label", "name", "address") ?? null,
      };
    })
    .filter((s): s is TripStop => s !== null);
  return { trip_id: tripId, stops };
}

// ─── GET /travel/trend ──────────────────────────────────────────────────────

export async function getTravelTrend(
  params?: GetTravelTrendParams,
): Promise<TravelTrendPoint[]> {
  const response = await api.get("/travel/trend", { params });
  return asList(response.data, "points", "series", "trend").map(
    (p: any): TravelTrendPoint => ({
      label: String(pick(p, "label", "date", "period", "week", "month") ?? ""),
      distance_km: Number(
        pick(p, "distance_km", "total_distance_km", "distance") ?? 0,
      ),
    }),
  );
}

// ─── GET /travel/live ───────────────────────────────────────────────────────

export async function getLivePositions(
  params?: GetLivePositionsParams,
): Promise<LivePosition[]> {
  const response = await api.get("/travel/live", { params });
  return asList(response.data, "positions", "employees")
    .map((p: any): LivePosition | null => {
      const lat = Number(pick(p, "lat", "latitude"));
      const lng = Number(pick(p, "lng", "lon", "longitude"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const speed = pick(p, "speed_kmh", "speed");
      return {
        employee_id: String(pick(p, "employee_id", "staff_id", "id") ?? ""),
        employee: String(pick(p, "employee", "name", "employee_name") ?? "Unknown"),
        lat,
        lng,
        speed_kmh: speed === undefined ? null : Number(speed),
        updated_at: pick(p, "updated_at", "timestamp", "time") ?? null,
        branch: pick(p, "branch") ?? null,
        team: pick(p, "team") ?? null,
      };
    })
    .filter((p): p is LivePosition => p !== null);
}

// ─── GET /travel/employees/{employee_id}/trips ──────────────────────────────

export async function getEmployeeTrips(
  employeeId: string,
  params?: GetEmployeeTripsParams,
): Promise<GetTravelTripsResponse> {
  const response = await api.get<GetTravelTripsResponse>(
    `/travel/employees/${employeeId}/trips`,
    { params },
  );
  return response.data;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

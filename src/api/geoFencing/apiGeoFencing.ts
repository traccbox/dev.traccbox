import api from "../AxiosInstance";
import {
  AssignEmployeesResponse,
  CreateLocationPayload,
  CreateWorkAreaPayload,
  CreateWorkAreaResponse,
  GeoCountry,
  GeoRegion,
  GeoSearchResult,
  GetAssignableEmployeesParams,
  GetAssignableEmployeesResponse,
  GetViolationsResponse,
  GetWorkAreaByIDResponse,
  GetWorkAreasParams,
  GetWorkAreasResponse,
  GeofenceCheckRequest,
  GeofenceCheckResponse,
  ToggleWorkAreaStatusPayload,
  UpdateLocationPayload,
  UpdateWorkAreaPayload,
  WorkAreaAttendance,
  WorkAreaLocationResponse,
  WorkAreaPresence,
  WorkAreaRules,
  WorkAreaStats,
  PlaceSuggestionsResponse,
  PlaceCoordinatesResponse,
} from "./typesGeoFencing";


export async function getWorkAreaStats(): Promise<WorkAreaStats> {
  const response = await api.get<WorkAreaStats>("/work-areas/stats");

  return response.data;
}

export async function getWorkAreas(
  params?: GetWorkAreasParams,
): Promise<GetWorkAreasResponse> {
  const response = await api.get<GetWorkAreasResponse>("/work-areas", {
    params,
  });

  return response.data;
}

export async function createWorkArea(
  data: CreateWorkAreaPayload,
): Promise<CreateWorkAreaResponse> {
  const response = await api.post<CreateWorkAreaResponse>("/work-areas", data);

  return response.data;
}

export async function getWorkAreaById(
  workAreaId: string,
): Promise<GetWorkAreaByIDResponse> {
  const response = await api.get<GetWorkAreaByIDResponse>(
    `/work-areas/${workAreaId}`,
  );

  return response.data;
}

export async function updateWorkAreaById(
  workAreaId: string,
  data: UpdateWorkAreaPayload,
): Promise<GetWorkAreaByIDResponse> {
  const response = await api.patch<GetWorkAreaByIDResponse>(
    `/work-areas/${workAreaId}`,
    data,
  );

  return response.data;
}

export async function deleteWorkAreaById(workAreaId: string): Promise<void> {
  await api.delete(`/work-areas/${workAreaId}`);
}

export async function toggleWorkAreaStatusById(
  workAreaId: string,
  data: ToggleWorkAreaStatusPayload,
): Promise<GetWorkAreaByIDResponse> {
  const response = await api.patch<GetWorkAreaByIDResponse>(
    `/work-areas/${workAreaId}/status`,
    data,
  );

  return response.data;
}

/* ---------- Replace work area ---------- */

export async function replaceWorkAreaById(
  workAreaId: string,
  data: CreateWorkAreaPayload,
): Promise<GetWorkAreaByIDResponse> {
  const response = await api.put<GetWorkAreaByIDResponse>(
    `/work-areas/${workAreaId}`,
    data,
  );

  return response.data;
}

/* ---------- Locations ---------- */

export async function getWorkAreaLocations(
  workAreaId: string,
): Promise<WorkAreaLocationResponse[]> {
  const response = await api.get<{ data: WorkAreaLocationResponse[] }>(
    `/work-areas/${workAreaId}/locations`,
  );

  return response.data?.data ?? [];
}

export async function addWorkAreaLocation(
  workAreaId: string,
  data: CreateLocationPayload,
): Promise<WorkAreaLocationResponse> {
  const response = await api.post<WorkAreaLocationResponse>(
    `/work-areas/${workAreaId}/locations`,
    data,
  );

  return response.data;
}

export async function updateWorkAreaLocation(
  workAreaId: string,
  locationId: string,
  data: UpdateLocationPayload,
): Promise<WorkAreaLocationResponse> {
  const response = await api.patch<WorkAreaLocationResponse>(
    `/work-areas/${workAreaId}/locations/${locationId}`,
    data,
  );

  return response.data;
}

export async function deleteWorkAreaLocation(
  workAreaId: string,
  locationId: string,
): Promise<void> {
  await api.delete(`/work-areas/${workAreaId}/locations/${locationId}`);
}

/* ---------- Employees ---------- */

export async function getAssignableEmployees(
  params?: GetAssignableEmployeesParams,
): Promise<GetAssignableEmployeesResponse> {
  const response = await api.get<GetAssignableEmployeesResponse>(
    "/work-areas/employees",
    { params },
  );

  return response.data;
}

export async function assignEmployees(
  workAreaId: string,
  employeeIds: string[],
): Promise<AssignEmployeesResponse> {
  const response = await api.post<AssignEmployeesResponse>(
    `/work-areas/${workAreaId}/employees`,
    { employee_ids: employeeIds },
  );

  return response.data;
}

export async function removeWorkAreaEmployee(
  workAreaId: string,
  employeeId: string,
): Promise<void> {
  await api.delete(`/work-areas/${workAreaId}/employees/${employeeId}`);
}

/* ---------- Rules ---------- */

export async function getWorkAreaRules(
  workAreaId: string,
): Promise<WorkAreaRules> {
  const response = await api.get<WorkAreaRules>(
    `/work-areas/${workAreaId}/rules`,
  );

  return response.data;
}

export async function updateWorkAreaRules(
  workAreaId: string,
  data: Partial<WorkAreaRules>,
): Promise<WorkAreaRules> {
  const response = await api.patch<WorkAreaRules>(
    `/work-areas/${workAreaId}/rules`,
    data,
  );

  return response.data;
}

/* ---------- Presence / attendance / violations ---------- */

export async function getWorkAreaPresence(
  workAreaId: string,
): Promise<WorkAreaPresence> {
  const response = await api.get<WorkAreaPresence>(
    `/work-areas/${workAreaId}/presence`,
  );

  return response.data;
}

export async function getWorkAreaAttendance(
  workAreaId: string,
  params?: { from?: string; to?: string },
): Promise<WorkAreaAttendance> {
  const response = await api.get<WorkAreaAttendance>(
    `/work-areas/${workAreaId}/attendance`,
    { params },
  );

  return response.data;
}

export async function getWorkAreaViolations(
  workAreaId: string,
  params?: { page?: number; limit?: number },
): Promise<GetViolationsResponse> {
  const response = await api.get<GetViolationsResponse>(
    `/work-areas/${workAreaId}/violations`,
    { params },
  );

  return response.data;
}

/* ---------- Geo ---------- */

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function getCountries(): Promise<GeoCountry[]> {
  const response = await api.get("/geo/countries");
  return unwrapList<GeoCountry>(response.data);
}

export async function getStates(country: string): Promise<GeoRegion[]> {
  const response = await api.get("/geo/states", { params: { country } });
  return unwrapList<GeoRegion>(response.data);
}

export async function getLgas(state: string): Promise<GeoRegion[]> {
  const response = await api.get("/geo/lgas", { params: { state } });
  return unwrapList<GeoRegion>(response.data);
}

export async function getWards(lga: string): Promise<GeoRegion[]> {
  const response = await api.get("/geo/wards", { params: { lga } });
  return unwrapList<GeoRegion>(response.data);
}

export async function getCommunities(ward: string): Promise<GeoRegion[]> {
  const response = await api.get("/geo/communities", { params: { ward } });
  return unwrapList<GeoRegion>(response.data);
}

export async function geoSearch(q: string): Promise<GeoSearchResult[]> {
  const response = await api.get("/geo/search", { params: { q } });
  return unwrapList<GeoSearchResult>(response.data);
}

export async function getMyWorkAreas(staffId?: string): Promise<GetWorkAreasResponse> {
  const response = await api.get<GetWorkAreasResponse>("/work-areas/mine", {
    params: staffId ? { staff_id: staffId } : undefined,
  });
  return response.data;
}

export async function checkGeofence(
  data: GeofenceCheckRequest,
): Promise<GeofenceCheckResponse> {
  const response = await api.post<GeofenceCheckResponse>(
    "/work-areas/check",
    data,
  );
  return response.data;
}

export async function suggestPlaces(
  input: string,
  language = "en",
): Promise<PlaceSuggestionsResponse> {
  const response = await api.get<PlaceSuggestionsResponse>("/places/suggest", {
    params: { input, language },
  });
  return response.data;
}

export async function getPlaceCoordinates(
  placeId: string,
): Promise<PlaceCoordinatesResponse> {
  const response = await api.get<PlaceCoordinatesResponse>(
    "/places/place-coordinates",
    { params: { place_id: placeId } },
  );
  return response.data;
}

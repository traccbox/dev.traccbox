import api from "../AxiosInstance";
import {
  CreateWorkAreaPayload,
  CreateWorkAreaResponse,
  GetWorkAreaByIDResponse,
  GetWorkAreasParams,
  GetWorkAreasResponse,
  ToggleWorkAreaStatusPayload,
  UpdateWorkAreaPayload,
  WorkAreaStats,
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

  console.log("Response", response);

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

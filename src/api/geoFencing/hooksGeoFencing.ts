import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addWorkAreaLocation,
  assignEmployees,
  deleteWorkAreaLocation,
  geoSearch,
  getAssignableEmployees,
  getCommunities,
  getCountries,
  getLgas,
  getStates,
  getWards,
  getWorkAreaAttendance,
  getWorkAreaLocations,
  getWorkAreaPresence,
  getWorkAreaRules,
  getWorkAreaViolations,
  removeWorkAreaEmployee,
  toggleWorkAreaStatusById,
  updateWorkAreaById,
  updateWorkAreaLocation,
  updateWorkAreaRules,
} from "./apiGeoFencing";
import {
  CreateLocationPayload,
  GetAssignableEmployeesParams,
  UpdateLocationPayload,
  UpdateWorkAreaPayload,
  WorkAreaRules,
} from "./typesGeoFencing";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const anyError = error as {
    response?: { data?: { message?: string; detail?: unknown } };
    message?: string;
  };
  const data = anyError?.response?.data;
  if (data?.message) return data.message;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    const first = data.detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
  }
  return anyError?.message || fallback;
}

/* ---------------- geo hooks ---------------- */

export const useCountries = () =>
  useQuery({
    queryKey: ["geo-countries"],
    queryFn: getCountries,
    staleTime: 60 * 60 * 1000,
  });

export const useStates = (country?: string) =>
  useQuery({
    queryKey: ["geo-states", country],
    queryFn: () => getStates(country as string),
    enabled: !!country,
    staleTime: 60 * 60 * 1000,
  });

export const useLgas = (state?: string) =>
  useQuery({
    queryKey: ["geo-lgas", state],
    queryFn: () => getLgas(state as string),
    enabled: !!state,
    staleTime: 60 * 60 * 1000,
  });

export const useWards = (lga?: string) =>
  useQuery({
    queryKey: ["geo-wards", lga],
    queryFn: () => getWards(lga as string),
    enabled: !!lga,
    staleTime: 60 * 60 * 1000,
  });

export const useCommunities = (ward?: string) =>
  useQuery({
    queryKey: ["geo-communities", ward],
    queryFn: () => getCommunities(ward as string),
    enabled: !!ward,
    staleTime: 60 * 60 * 1000,
  });

export const useGeoSearch = (q: string) =>
  useQuery({
    queryKey: ["geo-search", q],
    queryFn: () => geoSearch(q),
    enabled: q.trim().length > 2,
    staleTime: 5 * 60 * 1000,
  });

/* ---------------- work area sub-resources ---------------- */

export const useAssignableEmployees = (params: GetAssignableEmployeesParams) =>
  useQuery({
    queryKey: ["assignable-employees", params],
    queryFn: () => getAssignableEmployees(params),
    placeholderData: keepPreviousData,
  });

export const useWorkAreaLocations = (workAreaId?: string) =>
  useQuery({
    queryKey: ["work-area-locations", workAreaId],
    queryFn: () => getWorkAreaLocations(workAreaId as string),
    enabled: !!workAreaId,
  });

export const useWorkAreaRules = (workAreaId?: string) =>
  useQuery({
    queryKey: ["work-area-rules", workAreaId],
    queryFn: () => getWorkAreaRules(workAreaId as string),
    enabled: !!workAreaId,
  });

export const useWorkAreaPresence = (workAreaId?: string, enabled = true) =>
  useQuery({
    queryKey: ["work-area-presence", workAreaId],
    queryFn: () => getWorkAreaPresence(workAreaId as string),
    enabled: !!workAreaId && enabled,
    refetchInterval: 30000,
  });

export const useWorkAreaAttendance = (
  workAreaId?: string,
  range?: { from?: string; to?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["work-area-attendance", workAreaId, range],
    queryFn: () => getWorkAreaAttendance(workAreaId as string, range),
    enabled: !!workAreaId && enabled,
  });

export const useWorkAreaViolations = (
  workAreaId?: string,
  page = 1,
  limit = 10,
  enabled = true,
) =>
  useQuery({
    queryKey: ["work-area-violations", workAreaId, page, limit],
    queryFn: () => getWorkAreaViolations(workAreaId as string, { page, limit }),
    enabled: !!workAreaId && enabled,
    placeholderData: keepPreviousData,
  });

/* ---------------- mutations ---------------- */

function useInvalidateWorkArea(workAreaId?: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["work-areas"] });
    queryClient.invalidateQueries({ queryKey: ["work-area-stats"] });
    queryClient.invalidateQueries({ queryKey: ["work-area-details", workAreaId] });
    queryClient.invalidateQueries({ queryKey: ["work-area-locations", workAreaId] });
    queryClient.invalidateQueries({ queryKey: ["work-area-rules", workAreaId] });
    queryClient.invalidateQueries({ queryKey: ["work-area-presence", workAreaId] });
  };
}

export function useUpdateWorkArea(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (data: UpdateWorkAreaPayload) =>
      updateWorkAreaById(workAreaId, data),
    onSuccess: () => {
      toast.success("Work area updated");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to update work area")),
  });
}

export function useToggleWorkAreaStatus(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (status: "active" | "inactive") =>
      toggleWorkAreaStatusById(workAreaId, { status }),
    onSuccess: (_data, status) => {
      toast.success(`Work area ${status === "active" ? "enabled" : "disabled"}`);
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to change status")),
  });
}

export function useAddLocation(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (data: CreateLocationPayload) =>
      addWorkAreaLocation(workAreaId, data),
    onSuccess: () => {
      toast.success("Location added");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to add location")),
  });
}

export function useUpdateLocation(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: ({
      locationId,
      data,
    }: {
      locationId: string;
      data: UpdateLocationPayload;
    }) => updateWorkAreaLocation(workAreaId, locationId, data),
    onSuccess: () => {
      toast.success("Location updated");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to update location")),
  });
}

export function useDeleteLocation(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (locationId: string) =>
      deleteWorkAreaLocation(workAreaId, locationId),
    onSuccess: () => {
      toast.success("Location removed");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to remove location")),
  });
}

export function useAssignEmployees(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (employeeIds: string[]) =>
      assignEmployees(workAreaId, employeeIds),
    onSuccess: (data) => {
      toast.success(`${data?.assigned ?? 0} employee(s) assigned`);
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to assign employees")),
  });
}

export function useRemoveEmployee(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (employeeId: string) =>
      removeWorkAreaEmployee(workAreaId, employeeId),
    onSuccess: () => {
      toast.success("Employee removed from work area");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to remove employee")),
  });
}

export function useUpdateRules(workAreaId: string) {
  const invalidate = useInvalidateWorkArea(workAreaId);

  return useMutation({
    mutationFn: (data: Partial<WorkAreaRules>) =>
      updateWorkAreaRules(workAreaId, data),
    onSuccess: () => {
      toast.success("Geofence rules updated");
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to update rules")),
  });
}

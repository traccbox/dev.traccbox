import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPermissionsSchema,
  getRoleDefaults,
  getStaffPermissions,
  updateStaffPermissions,
  resetStaffPermissions,
  UpdatePermissionsRequest,
  ResetPermissionsRequest,
} from "../permissions";

export const permissionsKeys = {
  schema: ["permissions", "schema"] as const,
  defaults: (role: string) => ["permissions", "defaults", role] as const,
  staff: (companyId?: string, staffId?: string) =>
    ["permissions", "staff", companyId, staffId] as const,
};

export function usePermissionsSchema() {
  return useQuery({
    queryKey: permissionsKeys.schema,
    queryFn: getPermissionsSchema,
    staleTime: 60 * 60 * 1000, // schema is static
  });
}

export function useRoleDefaults(role?: string) {
  return useQuery({
    queryKey: permissionsKeys.defaults(role || ""),
    queryFn: () => getRoleDefaults(role as string),
    enabled: !!role,
    staleTime: 60 * 60 * 1000,
  });
}

export function useStaffPermissions(companyId?: string, staffId?: string) {
  return useQuery({
    queryKey: permissionsKeys.staff(companyId, staffId),
    queryFn: () =>
      getStaffPermissions(companyId as string, staffId as string),
    enabled: !!companyId && !!staffId,
  });
}

export function useUpdateStaffPermissions(companyId: string, staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePermissionsRequest) =>
      updateStaffPermissions(companyId, staffId, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: permissionsKeys.staff(companyId, staffId),
      });
    },
  });
}

export function useResetStaffPermissions(companyId: string, staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ResetPermissionsRequest = {}) =>
      resetStaffPermissions(companyId, staffId, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: permissionsKeys.staff(companyId, staffId),
      });
    },
  });
}

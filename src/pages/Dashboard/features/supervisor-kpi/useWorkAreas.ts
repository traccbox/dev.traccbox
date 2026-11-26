import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAllWorkAreas, toWorkLocation } from "@/api/supervisor-kpi/workAreas";
import { useWorkforce } from "./store";

/** The company's work areas. The "work-areas" key is refreshed by the Work Areas screens too. */
export function useWorkAreas() {
  const query = useQuery({
    queryKey: ["work-areas", "workforce-all"],
    queryFn: fetchAllWorkAreas,
    staleTime: 60_000,
    retry: 1,
  });
  const areas = useMemo(() => (query.data?.areas ?? []).map(toWorkLocation), [query.data]);
  return { ...query, areas };
}

/** Keep the cached details of linked locations in step with Work Areas. Mount once. */
export function useWorkAreaSync() {
  const { data, areas } = useWorkAreas();
  const { syncWorkAreas } = useWorkforce();
  useEffect(() => {
    if (data) syncWorkAreas(areas, data.complete);
  }, [data, areas, syncWorkAreas]);
}

/** Locations a user can choose from: this workspace's own first, then other work areas. */
export function useLocationOptions() {
  const { locations } = useWorkforce();
  const query = useWorkAreas();
  const { isStaff, hasPermission } = useAuth();

  const mine = locations.filter((l) => l.status === "active");
  const others = query.areas.filter((a) => a.status === "active" && !locations.some((l) => l.id === a.id));

  return {
    mine,
    others,
    /** Full records for ids picked from `others`, ready to link to the workspace. */
    toLink: (ids: string[]) => others.filter((a) => ids.includes(a.id)),
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => query.refetch(),
    canCreate: !isStaff || hasPermission("work_area_management", "create_work_areas"),
  };
}

/** Read-only bridge to the Work Areas module, the source of truth for locations. */
import { getWorkAreas } from "@/api/geoFencing/apiGeoFencing";
import type { WorkArea } from "@/api/geoFencing/typesGeoFencing";
import type { WorkLocation } from "./types";

const PAGE = 100;
const MAX_PAGES = 10;

export async function fetchAllWorkAreas(): Promise<{ areas: WorkArea[]; complete: boolean }> {
  const areas: WorkArea[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getWorkAreas({ page, limit: PAGE });
    areas.push(...(res?.data ?? []));
    const totalPages = res?.meta?.total_pages ?? 1;
    if (page >= totalPages) return { areas, complete: true };
  }
  return { areas, complete: false };
}

export function toWorkLocation(area: WorkArea): WorkLocation {
  const boundary = area.boundary ?? area.locations?.[0]?.boundary;
  const circle = boundary?.kind === "circle" ? boundary : undefined;
  return {
    id: area.id,
    source: "work_area",
    name: area.name,
    address: area.locations?.[0]?.address || area.description || undefined,
    type: area.type,
    latitude: circle?.center?.[0],
    longitude: circle?.center?.[1],
    geofenceRadius: circle?.radius,
    status: String(area.status).toLowerCase() === "inactive" ? "archived" : "active",
  };
}

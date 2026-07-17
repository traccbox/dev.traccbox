import api from "./AxiosInstance";

/**
 * Role Based Permissions API
 *
 * All routes are mounted under /api/v1/permissions on the backend.
 * The AxiosInstance already prefixes VITE_API_BASE, so we only append
 * the sub-path here. If VITE_API_BASE does NOT already include
 * /api/v1 for other routes, adjust the BASE constant below.
 */
const BASE = "/api/v1/permissions";

// ---- Types --------------------------------------------------------------

/** A single action key -> boolean map, e.g. { view_dashboard: true, ... } */
export type ActionMap = Record<string, boolean>;

/** Module key -> ActionMap, e.g. { core_dashboard_report: { view_dashboard: true } } */
export type PermissionsMap = Record<string, ActionMap>;

/** Schema returned by GET /schema — module key -> list of action keys */
export type PermissionsSchema = Record<string, string[]>;

export interface UpdatePermissionsRequest {
  permissions: PermissionsMap; // partial — only the deltas
}

export interface ResetPermissionsRequest {
  role?: string; // optional new role to reset to
}

// ---- Calls --------------------------------------------------------------

export async function getPermissionsSchema(): Promise<PermissionsSchema> {
  const res = await api.get(`${BASE}/schema`);
  const data = res.data;
  // Backend may return { permissions: {...} } or the map directly.
  return (data?.permissions ?? data?.schema ?? data) as PermissionsSchema;
}

export async function getRoleDefaults(role: string): Promise<PermissionsMap> {
  const res = await api.get(`${BASE}/defaults/${role}`);
  const data = res.data;
  return (data?.permissions ?? data) as PermissionsMap;
}

export async function getStaffPermissions(
  companyId: string,
  staffId: string,
): Promise<{ role?: string; permissions: PermissionsMap }> {
  const res = await api.get(`${BASE}/${companyId}/${staffId}`);
  const data = res.data;
  return {
    role: data?.role,
    permissions: (data?.permissions ?? data) as PermissionsMap,
  };
}

export async function updateStaffPermissions(
  companyId: string,
  staffId: string,
  body: UpdatePermissionsRequest,
) {
  const res = await api.patch(`${BASE}/${companyId}/${staffId}`, body);
  return res.data;
}

export async function resetStaffPermissions(
  companyId: string,
  staffId: string,
  body: ResetPermissionsRequest = {},
) {
  const res = await api.post(`${BASE}/${companyId}/${staffId}/reset`, body);
  return res.data;
}

// ---- Helpers ------------------------------------------------------------

/** snake_case / camelCase -> "Title Case" */
export function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Compute a shallow diff between two PermissionsMap objects.
 * Returns only modules that changed, and inside each module only actions
 * whose boolean value differs from the base. Used to keep PATCH bodies small.
 */
export function diffPermissions(
  base: PermissionsMap,
  next: PermissionsMap,
): PermissionsMap {
  const out: PermissionsMap = {};
  for (const mod of Object.keys(next)) {
    const nextActions = next[mod] || {};
    const baseActions = base[mod] || {};
    const changed: ActionMap = {};
    for (const act of Object.keys(nextActions)) {
      if (nextActions[act] !== baseActions[act]) {
        changed[act] = nextActions[act];
      }
    }
    if (Object.keys(changed).length) out[mod] = changed;
  }
  return out;
}

/**
 * Build a PermissionsMap from a schema, filling every action with the
 * supplied default (usually false). Useful when the current-permissions
 * response is missing a module the schema knows about.
 */
export function emptyFromSchema(
  schema: PermissionsSchema,
  fill = false,
): PermissionsMap {
  const out: PermissionsMap = {};
  for (const mod of Object.keys(schema)) {
    out[mod] = {};
    for (const act of schema[mod]) out[mod][act] = fill;
  }
  return out;
}

/**
 * Merge a partial PermissionsMap on top of a base map (shallow per module).
 */
export function mergePermissions(
  base: PermissionsMap,
  overlay: PermissionsMap,
): PermissionsMap {
  const out: PermissionsMap = { ...base };
  for (const mod of Object.keys(overlay)) {
    out[mod] = { ...(base[mod] || {}), ...(overlay[mod] || {}) };
  }
  return out;
}

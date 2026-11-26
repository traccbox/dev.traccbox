/** Pure operations on the set of workspaces. */
import { buildIndustryConfig, buildSampleData, emptyWorkspaceData, getPreset, uid } from "./presets";
import type { IndustryKey, WorkLocation, Workspace, WorkspaceRoot } from "./types";

export interface NewWorkspaceInput {
  name: string;
  industry: IndustryKey;
  currency: string;
  withSample: boolean;
}

export function createWorkspace(input: NewWorkspaceInput): Workspace {
  const { config, templates } = buildIndustryConfig(input.industry, input.currency);
  return {
    ...emptyWorkspaceData(),
    config,
    templates,
    ...(input.withSample ? buildSampleData(input.industry, config, templates) : {}),
    id: uid("ws"),
    name: input.name.trim() || getPreset(input.industry).label,
    createdAt: new Date().toISOString(),
  };
}

export const isNameTaken = (name: string, workspaces: Workspace[], exceptId?: string): boolean =>
  workspaces.some((w) => w.id !== exceptId && w.name.trim().toLowerCase() === name.trim().toLowerCase());

export const addWorkspace = (root: WorkspaceRoot, ws: Workspace): WorkspaceRoot => ({
  activeId: ws.id,
  workspaces: [...root.workspaces, ws],
});

export function removeWorkspace(root: WorkspaceRoot, id: string): WorkspaceRoot {
  const workspaces = root.workspaces.filter((w) => w.id !== id);
  const activeId = root.activeId === id ? (workspaces[0]?.id ?? null) : root.activeId;
  return { activeId, workspaces };
}

const isWorkspace = (w: unknown): w is Workspace => {
  const x = w as Workspace | undefined;
  return !!x?.id && !!x.config?.terms && Array.isArray(x.supervisors) && Array.isArray(x.locations);
};

/**
 * Restore saved workspaces. `legacy` is the earlier single-workspace format,
 * which is converted into the first workspace so nothing set up is lost.
 */
export function loadRoot(current: string | null, legacy: string | null): WorkspaceRoot {
  const parse = (raw: string | null): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saved = parse(current);
  if (saved && Array.isArray(saved.workspaces)) {
    const workspaces: Workspace[] = saved.workspaces.filter(isWorkspace);
    const activeId = workspaces.some((w) => w.id === saved.activeId) ? saved.activeId : (workspaces[0]?.id ?? null);
    return { activeId, workspaces };
  }

  const old = parse(legacy);
  if (old?.setupDone && old.config?.terms && Array.isArray(old.supervisors)) {
    const { setupDone: _done, ...data } = old;
    const ws: Workspace = {
      ...emptyWorkspaceData(),
      ...data,
      locations: (data.locations ?? []).map((l: WorkLocation) => ({ ...l, source: l.source ?? "local" })),
      id: uid("ws"),
      name: getPreset(data.config.industry).label,
      createdAt: new Date().toISOString(),
    };
    return { activeId: ws.id, workspaces: [ws] };
  }

  return { activeId: null, workspaces: [] };
}

/**
 * Refresh cached work-area details in every workspace. When `complete` is true
 * (we hold the full list) a linked area that disappeared is archived.
 * Returns the same object when nothing changed.
 */
export function syncWorkAreaLocations(root: WorkspaceRoot, fresh: WorkLocation[], complete: boolean): WorkspaceRoot {
  const byId = new Map(fresh.map((l) => [l.id, l]));
  let changed = false;
  const workspaces = root.workspaces.map((ws) => {
    let touched = false;
    const locations = ws.locations.map((loc) => {
      if (loc.source !== "work_area") return loc;
      const found = byId.get(loc.id);
      const next: WorkLocation = found ? { ...loc, ...found } : complete ? { ...loc, status: "archived" } : loc;
      if (JSON.stringify(next) === JSON.stringify(loc)) return loc;
      touched = true;
      return next;
    });
    if (!touched) return ws;
    changed = true;
    return { ...ws, locations };
  });
  return changed ? { ...root, workspaces } : root;
}

/** Why a location can't be removed from a workspace, or null if it can. */
export function locationInUse(ws: Workspace, locationId: string): { supervisors: number; tasks: number } | null {
  const supervisors = ws.supervisors.filter((s) => s.locationIds.includes(locationId)).length;
  const tasks = ws.tasks.filter((t) => t.locationId === locationId && !["completed", "cancelled"].includes(t.status)).length;
  return supervisors || tasks ? { supervisors, tasks } : null;
}

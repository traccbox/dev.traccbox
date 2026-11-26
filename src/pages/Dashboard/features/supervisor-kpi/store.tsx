import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentPeriod } from "@/api/supervisor-kpi/dates";
import { getSupervisorKpi } from "@/api/supervisor-kpi/kpi";
import { calculateBonus } from "@/api/supervisor-kpi/payroll";
import { buildSampleData, emptyWorkspaceData, uid } from "@/api/supervisor-kpi/presets";
import {
  addWorkspace,
  createWorkspace as buildWorkspace,
  loadRoot,
  removeWorkspace,
  syncWorkAreaLocations,
  type NewWorkspaceInput,
} from "@/api/supervisor-kpi/workspaces";
import type {
  DailyReport,
  OperationalTask,
  PayItem,
  Supervisor,
  SupervisorKpiResult,
  SupervisorPayrollRecord,
  TaskPriority,
  TaskStatus,
  TaskTemplate,
  WorkLocation,
  Worker,
  Workspace,
  WorkspaceConfig,
  WorkspaceRoot,
} from "@/api/supervisor-kpi/types";

/**
 * Workspace store. A company can run several independent workspaces (one per
 * business line / industry); every action below applies to the active one.
 *
 * Until the backend exists this persists to localStorage. Each action maps to
 * one future API call, so swapping persistence for HTTP changes no screen.
 */
const STORAGE_KEY = "workforce-supervisor:v3";
const LEGACY_KEY = "workforce-supervisor:v2";

const load = (): WorkspaceRoot => {
  try {
    return loadRoot(localStorage.getItem(STORAGE_KEY), localStorage.getItem(LEGACY_KEY));
  } catch {
    return { activeId: null, workspaces: [] };
  }
};

/** Stand-in while no workspace exists (only the onboarding screen renders then). */
const NONE: Workspace = { ...emptyWorkspaceData(), id: "", name: "", createdAt: "" };

export interface NewSupervisorInput {
  name: string;
  phone: string;
  email?: string;
  employeeCode?: string;
  title?: string;
  locationIds: string[];
  fixedPay: number;
  maxBonus: number;
  notes?: string;
}

export interface NewTaskInput {
  title: string;
  description: string;
  templateId?: string;
  locationId: string;
  supervisorId: string;
  workerIds: string[];
  unit: string;
  targetQuantity: number;
  priority: TaskPriority;
  requiresReview: boolean;
  requiresEvidence: boolean;
  startsAt: string;
  dueAt: string;
  checklist: string[];
}

type NewReportInput = Omit<DailyReport, "id" | "submittedAt" | "reviewStatus" | "source">;

interface Store extends Workspace {
  workspaces: Workspace[];
  period: string;
  setPeriod: (p: string) => void;
  kpiFor: (supervisorId: string, period?: string) => SupervisorKpiResult;

  createWorkspace: (input: NewWorkspaceInput) => void;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  reloadSampleData: () => void;
  updateConfig: (fn: (c: WorkspaceConfig) => WorkspaceConfig) => void;

  linkLocations: (locations: WorkLocation[]) => void;
  unlinkLocation: (id: string) => void;
  syncWorkAreas: (fresh: WorkLocation[], complete: boolean) => void;
  saveTemplate: (t: Partial<TaskTemplate> & { name: string; unit: string }) => void;
  removeTemplate: (id: string) => void;

  addSupervisor: (s: NewSupervisorInput) => Supervisor;
  updateSupervisor: (id: string, patch: Partial<Supervisor>) => void;
  resendInvite: (id: string) => void;
  addWorker: (w: { name: string; phone?: string; supervisorId: string; locationId?: string }) => void;
  updateWorker: (id: string, patch: Partial<Worker>) => void;

  addTask: (t: NewTaskInput) => OperationalTask;
  updateTask: (id: string, patch: Partial<OperationalTask>) => void;
  logProgress: (id: string, increment: number, note: string, evidence: string[]) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  submitForReview: (id: string) => void;
  reviewTask: (id: string, approvedOutput: number, note: string) => void;
  returnTask: (id: string, reason: string) => void;
  toggleChecklist: (taskId: string, itemId: string) => void;

  addReport: (r: NewReportInput) => void;
  reviewReport: (id: string, status: "approved" | "returned", note: string) => void;

  setManualScore: (supervisorId: string, metricId: string, period: string, score: number, note?: string) => void;

  generatePayroll: (period: string) => number;
  recalcPayroll: (id: string) => void;
  updatePayroll: (id: string, patch: Partial<SupervisorPayrollRecord>) => void;
  addPayItem: (id: string, kind: "allowances" | "deductions", item: Omit<PayItem, "id">) => void;
  removePayItem: (id: string, kind: "allowances" | "deductions", itemId: string) => void;
  approvePayroll: (ids: string[]) => void;
  markPaid: (id: string, reference: string) => void;
}

const Ctx = createContext<Store | null>(null);

export const WorkforceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [root, setRoot] = useState<WorkspaceRoot>(load);
  const data = root.workspaces.find((w) => w.id === root.activeId) ?? NONE;
  const [period, setPeriod] = useState(currentPeriod());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch {
      /* storage full / blocked — the session still works */
    }
  }, [root]);

  /** Apply a change to the active workspace only. */
  const patch = useCallback(
    (fn: (d: Workspace) => Partial<Workspace>) =>
      setRoot((r) => ({
        ...r,
        workspaces: r.workspaces.map((w) => (w.id === r.activeId ? { ...w, ...fn(w) } : w)),
      })),
    [],
  );
  // Stable identity: it is used inside an effect that watches the work-area query.
  const syncWorkAreas = useCallback(
    (fresh: WorkLocation[], complete: boolean) => setRoot((r) => syncWorkAreaLocations(r, fresh, complete)),
    [],
  );
  const mapTask = (id: string, fn: (t: OperationalTask) => OperationalTask) =>
    patch((d) => ({ tasks: d.tasks.map((t) => (t.id === id ? fn(t) : t)) }));

  const kpiWith = useCallback(
    (d: Workspace, supervisorId: string, p: string) =>
      getSupervisorKpi({
        supervisorId, period: p, tasks: d.tasks, reports: d.reports, manualScores: d.manualScores,
        metrics: d.config.kpi, reportTemplate: d.config.report,
      }),
    [],
  );

  const store = useMemo<Store>(() => {
    const kpiFor = (supervisorId: string, p = period) => kpiWith(data, supervisorId, p);

    const pricePayroll = (d: Workspace, rec: SupervisorPayrollRecord) => {
      const score = kpiWith(d, rec.supervisorId, rec.period).score;
      return { kpiScore: score, bonus: calculateBonus(score, rec.maxBonus, d.config.pay) };
    };

    return {
      ...data,
      workspaces: root.workspaces,
      period,
      setPeriod,
      kpiFor,

      createWorkspace: (input) => {
        const ws = buildWorkspace(input);
        setRoot((r) => addWorkspace(r, ws));
      },
      switchWorkspace: (id) => setRoot((r) => ({ ...r, activeId: id })),
      renameWorkspace: (id, name) =>
        setRoot((r) => ({ ...r, workspaces: r.workspaces.map((w) => (w.id === id ? { ...w, name } : w)) })),
      deleteWorkspace: (id) => setRoot((r) => removeWorkspace(r, id)),
      reloadSampleData: () =>
        patch((d) => ({
          ...buildSampleData(d.config.industry, d.config, d.templates),
          manualScores: [],
          payroll: [],
        })),
      updateConfig: (fn) => patch((d) => ({ config: fn(d.config) })),

      linkLocations: (incoming) =>
        patch((d) => {
          const fresh = incoming.filter((l) => !d.locations.some((x) => x.id === l.id));
          return fresh.length ? { locations: [...d.locations, ...fresh] } : {};
        }),
      unlinkLocation: (id) =>
        patch((d) => ({ locations: d.locations.filter((l) => l.id !== id) })),
      syncWorkAreas,
      saveTemplate: (tpl) =>
        patch((d) =>
          tpl.id
            ? { templates: d.templates.map((x) => (x.id === tpl.id ? { ...x, ...tpl } : x)) }
            : {
                templates: [
                  ...d.templates,
                  { id: uid("tpl"), requiresReview: true, requiresEvidence: false, checklist: [], ...tpl } as TaskTemplate,
                ],
              },
        ),
      removeTemplate: (id) => patch((d) => ({ templates: d.templates.filter((x) => x.id !== id) })),

      addSupervisor: (s) => {
        const now = new Date().toISOString();
        const sup: Supervisor = { id: uid("sup"), ...s, status: "invited", invitedAt: now, createdAt: now };
        patch((d) => ({ supervisors: [...d.supervisors, sup] }));
        return sup;
      },
      updateSupervisor: (id, p) =>
        patch((d) => ({ supervisors: d.supervisors.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
      resendInvite: (id) =>
        patch((d) => ({
          supervisors: d.supervisors.map((s) => (s.id === id ? { ...s, invitedAt: new Date().toISOString() } : s)),
        })),
      addWorker: (w) =>
        patch((d) => ({ workers: [...d.workers, { id: uid("wrk"), status: "active", ...w }] })),
      updateWorker: (id, p) =>
        patch((d) => ({ workers: d.workers.map((w) => (w.id === id ? { ...w, ...p } : w)) })),

      addTask: (input) => {
        const now = new Date().toISOString();
        const maxN = data.tasks.reduce((m, t) => Math.max(m, Number(t.code.replace(/\D/g, "")) || 0), 1000);
        const task: OperationalTask = {
          id: uid("tsk"), code: `TSK-${maxN + 1}`, ...input,
          checklist: input.checklist.map((label) => ({ id: uid("chk"), label, done: false })),
          submittedOutput: 0, reviewedOutput: 0, approvedOutput: 0, status: "assigned",
          progress: [], reworkCount: 0, createdAt: now, createdBy: "Admin",
        };
        patch((d) => ({ tasks: [task, ...d.tasks] }));
        return task;
      },
      updateTask: (id, p) => mapTask(id, (t) => ({ ...t, ...p })),
      // Progress is append-only: entries are never edited or removed.
      logProgress: (id, increment, note, evidence) =>
        mapTask(id, (t) => {
          const cumulative = t.submittedOutput + increment;
          return {
            ...t,
            submittedOutput: cumulative,
            status: t.status === "assigned" || t.status === "rework" ? "in_progress" : t.status,
            progress: [
              ...t.progress,
              { id: uid("prg"), increment, cumulative, createdAt: new Date().toISOString(), recordedBy: "Admin (on behalf)", source: "dashboard", note, evidence },
            ],
          };
        }),
      setTaskStatus: (id, status) =>
        mapTask(id, (t) => ({ ...t, status, completedAt: status === "completed" ? new Date().toISOString() : t.completedAt })),
      submitForReview: (id) =>
        mapTask(id, (t) =>
          t.requiresReview
            ? { ...t, status: "under_review" }
            : { ...t, status: "completed", completedAt: new Date().toISOString() },
        ),
      reviewTask: (id, approvedOutput, note) =>
        mapTask(id, (t) => ({
          ...t, reviewedOutput: t.submittedOutput, approvedOutput, reviewNote: note || undefined,
          status: "completed", completedAt: new Date().toISOString(),
        })),
      returnTask: (id, reason) =>
        mapTask(id, (t) => ({
          ...t, reviewedOutput: t.submittedOutput, status: "rework", reviewNote: reason, reworkCount: t.reworkCount + 1,
        })),
      toggleChecklist: (taskId, itemId) =>
        mapTask(taskId, (t) => ({
          ...t, checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
        })),

      addReport: (r) =>
        patch((d) => ({
          reports: [
            // one report per supervisor per day: a new submission replaces a returned one
            ...d.reports.filter((x) => !(x.supervisorId === r.supervisorId && x.reportDate === r.reportDate)),
            { id: uid("rpt"), ...r, submittedAt: new Date().toISOString(), reviewStatus: "submitted", source: "dashboard" },
          ],
        })),
      reviewReport: (id, status, note) =>
        patch((d) => ({
          reports: d.reports.map((r) =>
            r.id === id ? { ...r, reviewStatus: status, reviewNote: note || undefined, reviewedAt: new Date().toISOString() } : r,
          ),
        })),

      setManualScore: (supervisorId, metricId, p, score, note) =>
        patch((d) => ({
          manualScores: [
            ...d.manualScores.filter((m) => !(m.supervisorId === supervisorId && m.metricId === metricId && m.period === p)),
            { id: uid("ms"), supervisorId, metricId, period: p, score: Math.min(100, Math.max(0, score)), note, recordedAt: new Date().toISOString() },
          ],
        })),

      generatePayroll: (p) => {
        const have = new Set(data.payroll.filter((r) => r.period === p).map((r) => r.supervisorId));
        const fresh = data.supervisors
          .filter((s) => s.status === "active" && !have.has(s.id))
          .map((s) => {
            const base: SupervisorPayrollRecord = {
              id: uid("pay"), supervisorId: s.id, period: p, fixedPay: s.fixedPay, maxBonus: s.maxBonus,
              kpiScore: null, bonus: 0, allowances: [], deductions: [], status: "pending",
              createdAt: new Date().toISOString(),
            };
            return { ...base, ...pricePayroll(data, base) };
          });
        // Re-check inside the updater so a double click can never create duplicates.
        patch((d) => ({
          payroll: [
            ...d.payroll,
            ...fresh.filter((f) => !d.payroll.some((r) => r.period === f.period && r.supervisorId === f.supervisorId)),
          ],
        }));
        return fresh.length;
      },
      recalcPayroll: (id) =>
        patch((d) => ({
          payroll: d.payroll.map((r) => (r.id === id && r.status === "pending" ? { ...r, ...pricePayroll(d, r) } : r)),
        })),
      updatePayroll: (id, p) =>
        patch((d) => ({ payroll: d.payroll.map((r) => (r.id === id && r.status !== "paid" ? { ...r, ...p } : r)) })),
      addPayItem: (id, kind, item) =>
        patch((d) => ({
          payroll: d.payroll.map((r) =>
            r.id === id && r.status === "pending" ? { ...r, [kind]: [...r[kind], { id: uid("itm"), ...item }] } : r,
          ),
        })),
      removePayItem: (id, kind, itemId) =>
        patch((d) => ({
          payroll: d.payroll.map((r) =>
            r.id === id && r.status === "pending" ? { ...r, [kind]: r[kind].filter((i) => i.id !== itemId) } : r,
          ),
        })),
      approvePayroll: (ids) =>
        patch((d) => ({
          payroll: d.payroll.map((r) => {
            if (!ids.includes(r.id) || r.status !== "pending") return r;
            // Freeze the KPI-based bonus at approval time.
            return { ...r, ...pricePayroll(d, r), status: "approved", approvedAt: new Date().toISOString() };
          }),
        })),
      markPaid: (id, reference) =>
        patch((d) => ({
          payroll: d.payroll.map((r) =>
            r.id === id && r.status === "approved"
              ? { ...r, status: "paid", paidAt: new Date().toISOString(), paymentReference: reference }
              : r,
          ),
        })),
    };
  }, [data, root.workspaces, period, patch, kpiWith, syncWorkAreas]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
};

export const useWorkforce = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkforce must be used inside WorkforceProvider");
  return c;
};

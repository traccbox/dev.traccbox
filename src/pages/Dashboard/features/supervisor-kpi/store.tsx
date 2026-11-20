import React, { createContext, useContext, useMemo, useState } from "react";
import {
  INITIAL_DAILY_REPORTS,
  INITIAL_SUPERVISOR_PAYROLL,
  INITIAL_TASKS,
  SAMPLE_SUPERVISORS,
} from "@/api/supervisor-kpi/mockData";
import type {
  DailyProgressReport,
  OperationalTask,
  SupervisorPayrollRecord,
} from "@/api/supervisor-kpi/types";

interface Store {
  tasks: OperationalTask[];
  reports: DailyProgressReport[];
  payroll: SupervisorPayrollRecord[];
  supervisors: typeof SAMPLE_SUPERVISORS;
  addTask: (t: OperationalTask) => void;
  addProgress: (id: string, increment: number, note: string, evidence: string) => void;
  submitForInspection: (id: string) => void;
  inspect: (id: string, approvedOutput: number, note: string) => void;
  returnForRework: (id: string, reason: string) => void;
  addReport: (r: DailyProgressReport) => void;
  reviewReport: (id: string, status: "approved" | "returned", note: string) => void;
  updatePayroll: (id: string, patch: Partial<SupervisorPayrollRecord>) => void;
}

const Ctx = createContext<Store | null>(null);

export const SupervisorStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [reports, setReports] = useState(INITIAL_DAILY_REPORTS);
  const [payroll, setPayroll] = useState(INITIAL_SUPERVISOR_PAYROLL);

  const patchTask = (id: string, fn: (t: OperationalTask) => OperationalTask) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  const value = useMemo<Store>(
    () => ({
      tasks,
      reports,
      payroll,
      supervisors: SAMPLE_SUPERVISORS,
      addTask: (t) => setTasks((ts) => [t, ...ts]),
      // Progress is append-only: entries are never edited or removed.
      addProgress: (id, increment, note, evidence) =>
        patchTask(id, (t) => {
          const cumulative = t.submittedOutput + increment;
          const now = new Date().toISOString();
          return {
            ...t,
            submittedOutput: cumulative,
            verifiedOutput: cumulative,
            status: t.status === "assigned" || t.status === "rework" ? "in_progress" : t.status,
            progress: [
              ...t.progress,
              {
                id: `pr-${Date.now()}`,
                increment,
                cumulative,
                createdAt: now,
                recordedBy: "You (sample)",
                note,
                evidence: evidence ? [evidence] : [],
              },
            ],
          };
        }),
      submitForInspection: (id) => patchTask(id, (t) => ({ ...t, status: "under_inspection" })),
      inspect: (id, approvedOutput, note) =>
        patchTask(id, (t) => ({
          ...t,
          inspectedOutput: t.submittedOutput,
          approvedOutput,
          inspectionNote: note,
          status: "completed",
          approvedAt: new Date().toISOString(),
        })),
      returnForRework: (id, reason) =>
        patchTask(id, (t) => ({ ...t, status: "rework", inspectionNote: reason })),
      addReport: (r) => setReports((rs) => [r, ...rs]),
      reviewReport: (id, status, note) =>
        setReports((rs) => rs.map((r) => (r.id === id ? { ...r, reviewStatus: status, reviewNote: note } : r))),
      updatePayroll: (id, patch) =>
        setPayroll((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    }),
    [tasks, reports, payroll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSupervisorStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSupervisorStore must be used inside SupervisorStoreProvider");
  return c;
};

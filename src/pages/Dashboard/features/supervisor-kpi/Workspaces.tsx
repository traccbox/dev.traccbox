import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getPreset } from "@/api/supervisor-kpi/presets";
import type { Workspace } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import { Avatar, BASE, Pill, btnGhost, btnPrimary, fmtDate, lower } from "./ui";

/** Every workspace (business line / industry) the company has created. */
const Workspaces: React.FC = () => {
  const { id, workspaces, switchWorkspace, deleteWorkspace } = useWorkforce();
  const confirm = useConfirm();
  const nav = useNavigate();

  const open = (w: Workspace, path = "") => {
    nav(`${BASE}${path}`);
    switchWorkspace(w.id);
  };
  const remove = async (w: Workspace) => {
    const ok = await confirm({
      title: `Delete ${w.name}?`,
      message: "This permanently deletes the workspace with its setup, people, tasks, reports and payroll. Other workspaces and your Work Areas are not affected.",
      confirmLabel: "Delete workspace",
      tone: "danger",
      requireText: w.name,
    });
    if (ok) {
      deleteWorkspace(w.id);
      toast.success(`${w.name} deleted`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Your workspaces ({workspaces.length})</h2>
          <p className="text-xs text-gray-500">Each one keeps its own wording, people, tasks, reports, scorecard and payroll.</p>
        </div>
        <button className={btnPrimary} onClick={() => nav(`${BASE}/workspaces/new`)}><Plus className="h-4 w-4" /> Add another industry</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.map((w) => {
          const T = w.config.terms;
          const current = w.id === id;
          const openTasks = w.tasks.filter((t) => !["completed", "cancelled"].includes(t.status)).length;
          return (
            <article key={w.id} className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${current ? "border-[#1658E5] ring-2 ring-blue-100" : "border-gray-100"}`}>
              <div className="flex items-start gap-3">
                <Avatar name={w.name} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-900">{w.name}</h3>
                  <p className="truncate text-xs text-gray-500">{getPreset(w.config.industry).label} · created {fmtDate(w.createdAt)}</p>
                </div>
                {current && <Pill tone="blue">Current</Pill>}
              </div>
              <dl className="my-4 grid grid-cols-3 gap-2 text-center">
                {[
                  [T.supervisors, w.supervisors.length],
                  [T.locations, w.locations.length],
                  [`Open ${lower(T.tasks)}`, openTasks],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-gray-50 px-1 py-2">
                    <dd className="text-lg font-bold text-gray-900">{value}</dd>
                    <dt className="truncate text-[11px] text-gray-500">{label}</dt>
                  </div>
                ))}
              </dl>
              <div className="mt-auto flex items-center gap-2">
                <button className={current ? btnGhost : btnPrimary} onClick={() => open(w)}>{current ? "Open" : "Switch to this"}</button>
                <button className={btnGhost} onClick={() => open(w, "/setup")}>Setup</button>
                <button className="ml-auto text-xs font-medium text-red-500" onClick={() => remove(w)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Workspaces;

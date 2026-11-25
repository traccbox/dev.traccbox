import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useWorkforce } from "./store";
import TaskSheet from "./TaskSheet";
import TaskDetail from "./TaskDetail";
import { Empty, Panel, PriorityPill, Pill, ProgressBar, TASK_STATUS, TaskStatusPill, btnPrimary, cap, fmtDate, inputCls, lower, useTerms } from "./ui";

const OPEN = ["assigned", "in_progress", "rework", "on_hold"];

const Tasks: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const view = params.get("filter") ?? "all";
  const supFilter = params.get("supervisor") ?? "all";
  const locFilter = params.get("location") ?? "all";
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const now = new Date();
  const rows = useMemo(
    () =>
      w.tasks
        .filter((t) => {
          if (supFilter !== "all" && t.supervisorId !== supFilter) return false;
          if (locFilter !== "all" && t.locationId !== locFilter) return false;
          if (view === "open" && !OPEN.includes(t.status) && t.status !== "under_review") return false;
          if (view === "overdue" && !(OPEN.includes(t.status) && new Date(t.dueAt) < now)) return false;
          if (view === "review" && t.status !== "under_review") return false;
          if (view in TASK_STATUS && t.status !== view) return false;
          return `${t.code} ${t.title}`.toLowerCase().includes(q.toLowerCase());
        })
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [w.tasks, supFilter, locFilter, view, q], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-4">
      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input className={`${inputCls} pl-9`} placeholder={`Search ${lower(T.tasks)}`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={`${inputCls} w-auto`} value={view} onChange={(e) => setParam("filter", e.target.value)}>
            <option value="all">All {lower(T.tasks)}</option>
            <option value="open">Open</option>
            <option value="overdue">Overdue</option>
            <option value="review">Awaiting review</option>
            {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className={`${inputCls} w-auto`} value={supFilter} onChange={(e) => setParam("supervisor", e.target.value)}>
            <option value="all">All {lower(T.supervisors)}</option>
            {w.supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={`${inputCls} w-auto`} value={locFilter} onChange={(e) => setParam("location", e.target.value)}>
            <option value="all">All {lower(T.locations)}</option>
            {w.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Assign {lower(T.task)}</button>
        </div>
      </Panel>

      <Panel bodyClassName="p-0">
        {w.tasks.length === 0 ? (
          <Empty title={`No ${lower(T.tasks)} yet`} message={`Assign a ${lower(T.task)} to a ${lower(T.supervisor)}. It shows up in their mobile app straight away.`} action={{ label: `Assign ${lower(T.task)}`, onClick: () => setCreating(true) }} />
        ) : rows.length === 0 ? (
          <Empty title="Nothing matches these filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{cap(T.task)}</th>
                  <th className="px-3 py-3 text-left font-medium">{cap(T.supervisor)}</th>
                  <th className="px-3 py-3 text-left font-medium">Progress</th>
                  <th className="px-3 py-3 text-left font-medium">Due</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const late = OPEN.includes(t.status) && new Date(t.dueAt) < now;
                  const pct = t.targetQuantity ? (t.submittedOutput / t.targetQuantity) * 100 : 0;
                  return (
                    <tr key={t.id} onClick={() => setOpenId(t.id)} className="cursor-pointer border-t border-gray-50 hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.code} · {w.locations.find((l) => l.id === t.locationId)?.name ?? "—"} <PriorityPill priority={t.priority} /></div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">{w.supervisors.find((s) => s.id === t.supervisorId)?.name ?? "—"}</td>
                      <td className="w-48 px-3 py-3">
                        <ProgressBar value={pct} tone={t.status === "completed" ? "green" : late ? "red" : "blue"} />
                        <div className="mt-1 text-[11px] text-gray-500">{t.submittedOutput}/{t.targetQuantity} {t.unit}</div>
                      </td>
                      <td className={`px-3 py-3 text-xs ${late ? "font-semibold text-red-600" : "text-gray-600"}`}>{fmtDate(t.dueAt)} {late && <Pill tone="red">Overdue</Pill>}</td>
                      <td className="px-4 py-3"><TaskStatusPill status={t.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <TaskSheet open={creating} onClose={() => setCreating(false)} presetSupervisor={supFilter !== "all" ? supFilter : undefined} />
      <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default Tasks;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { periodLabel } from "@/api/supervisor-kpi/dates";
import type { SupervisorStatus } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import SupervisorSheet from "./SupervisorSheet";
import { Avatar, BASE, Empty, Panel, PeriodPicker, ScoreBadge, SupervisorStatusPill, btnPrimary, cap, inputCls, lower, useTerms } from "./ui";

const Supervisors: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | SupervisorStatus>("all");

  useEffect(() => {
    if (params.get("new")) {
      setAdding(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const rows = useMemo(
    () =>
      w.supervisors
        .filter((s) => (status === "all" || s.status === status) && `${s.name} ${s.phone} ${s.employeeCode ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        .map((s) => ({
          s,
          team: w.workers.filter((x) => x.supervisorId === s.id && x.status === "active").length,
          open: w.tasks.filter((t) => t.supervisorId === s.id && ["assigned", "in_progress", "rework", "on_hold", "under_review"].includes(t.status)).length,
          score: s.status === "active" ? w.kpiFor(s.id).score : null,
          places: s.locationIds.map((id) => w.locations.find((l) => l.id === id)?.name).filter(Boolean) as string[],
        })),
    [w, q, status],
  );

  return (
    <div className="space-y-4">
      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search name, phone or code" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invite pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <PeriodPicker value={w.period} onChange={w.setPeriod} />
          <button className={btnPrimary} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add {lower(T.supervisor)}</button>
        </div>
      </Panel>

      <Panel bodyClassName="p-0" subtitle={`KPI score shown for ${periodLabel(w.period)}`}>
        {w.supervisors.length === 0 ? (
          <Empty title={`No ${lower(T.supervisors)} yet`} message={`Add a ${lower(T.supervisor)} to invite them to the mobile app.`} action={{ label: `Add ${lower(T.supervisor)}`, onClick: () => setAdding(true) }} />
        ) : rows.length === 0 ? (
          <Empty title="No matches" message="Try a different search or status." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{cap(T.supervisor)}</th>
                  <th className="px-3 py-3 text-left font-medium">{cap(T.locations)}</th>
                  <th className="px-3 py-3 text-right font-medium">Team</th>
                  <th className="px-3 py-3 text-right font-medium">Open {lower(T.tasks)}</th>
                  <th className="px-3 py-3 text-center font-medium">KPI</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, team, open, score, places }) => (
                  <tr key={s.id} onClick={() => nav(`${BASE}/supervisors/${s.id}`)} className="cursor-pointer border-t border-gray-50 hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div>
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.title || s.phone}{s.employeeCode ? ` · ${s.employeeCode}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{places.join(", ") || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-3 py-3 text-right">{team}</td>
                    <td className="px-3 py-3 text-right">{open}</td>
                    <td className="px-3 py-3 text-center"><ScoreBadge score={score} /></td>
                    <td className="px-4 py-3"><SupervisorStatusPill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <SupervisorSheet open={adding} onClose={() => setAdding(false)} onCreated={(s) => nav(`${BASE}/supervisors/${s.id}`)} />
    </div>
  );
};

export default Supervisors;

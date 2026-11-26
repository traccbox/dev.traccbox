import React, { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { periodLabel } from "@/api/supervisor-kpi/dates";
import { netPay } from "@/api/supervisor-kpi/payroll";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import KpiBreakdown from "./KpiBreakdown";
import SupervisorSheet from "./SupervisorSheet";
import {
  Avatar, BASE, Empty, PayPill, Panel, PeriodPicker, Pill, ProgressBar, ReviewPill, StatTile, SupervisorStatusPill, TaskStatusPill,
  btnDanger, btnGhost, btnPrimary, cap, fmtDate, fmtDateTime, inputCls, lower, useMoney, useTerms,
} from "./ui";

const TABS = ["performance", "team", "tasks", "reports", "pay"] as const;

const SupervisorDetail: React.FC = () => {
  const { id } = useParams();
  const w = useWorkforce();
  const T = useTerms();
  const money = useMoney();
  const confirm = useConfirm();
  const [tab, setTab] = useState<(typeof TABS)[number]>("performance");
  const [editing, setEditing] = useState(false);
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");

  const sup = w.supervisors.find((s) => s.id === id);
  if (!sup) return <Navigate to={`${BASE}/supervisors`} replace />;

  const team = w.workers.filter((x) => x.supervisorId === sup.id);
  const tasks = w.tasks.filter((t) => t.supervisorId === sup.id);
  const reports = w.reports.filter((r) => r.supervisorId === sup.id).sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  const pay = w.payroll.filter((p) => p.supervisorId === sup.id).sort((a, b) => b.period.localeCompare(a.period));
  const kpi = w.kpiFor(sup.id);
  const open = tasks.filter((t) => ["assigned", "in_progress", "rework", "on_hold", "under_review"].includes(t.status));
  const places = sup.locationIds.map((l) => w.locations.find((x) => x.id === l)?.name).filter(Boolean).join(", ");

  const setStatus = (status: typeof sup.status) => {
    w.updateSupervisor(sup.id, { status, activatedAt: status === "active" && !sup.activatedAt ? new Date().toISOString() : sup.activatedAt });
    toast.success(status === "suspended" ? "Access suspended — they can no longer use the mobile app" : "Access restored");
  };

  return (
    <div className="space-y-5">
      <Link to={`${BASE}/supervisors`} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#1658E5]">
        <ArrowLeft className="h-3.5 w-3.5" /> All {lower(T.supervisors)}
      </Link>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="scale-125"><Avatar name={sup.name} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{sup.name}</h2>
                <SupervisorStatusPill status={sup.status} />
              </div>
              <p className="text-sm text-gray-500">{sup.title || cap(T.supervisor)}{sup.employeeCode ? ` · ${sup.employeeCode}` : ""}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{sup.phone}</span>
                {sup.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{sup.email}</span>}
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{places || `No ${lower(T.location)} assigned`}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => setEditing(true)}>Edit</button>
            {sup.status === "invited" && (
              <>
                <button className={btnGhost} onClick={() => { w.resendInvite(sup.id); toast.success("Invite re-sent"); }}>Resend invite</button>
                <button className={btnGhost} onClick={() => setStatus("active")} title="Demo helper until the backend activates accounts">Mark as joined</button>
              </>
            )}
            {sup.status === "active" && <button className={btnDanger} onClick={async () => (await confirm({ title: `Suspend ${sup.name}?`, message: "They lose access to the mobile app until you restore it. Their records are kept.", confirmLabel: "Suspend", tone: "danger" })) && setStatus("suspended")}>Suspend</button>}
            {sup.status === "suspended" && <button className={btnPrimary} onClick={() => setStatus("active")}>Restore access</button>}
          </div>
        </div>
        {sup.invitedAt && sup.status === "invited" && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Invite sent {fmtDateTime(sup.invitedAt)}. They appear as active once they sign in on the mobile app.</p>}
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={`KPI · ${periodLabel(w.period)}`} value={kpi.score === null ? "N/A" : kpi.score.toFixed(0)} tone={kpi.score === null ? "default" : kpi.score >= 80 ? "good" : kpi.score >= 60 ? "warn" : "bad"} />
        <StatTile label={`Open ${lower(T.tasks)}`} value={open.length} hint={`${tasks.length} in total`} />
        <StatTile label={`Team (${lower(T.workers)})`} value={team.filter((x) => x.status === "active").length} />
        <StatTile label="Pay" value={money(sup.fixedPay)} hint={`+ up to ${money(sup.maxBonus)} bonus`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-blue-50 text-[#1658E5]" : "text-gray-600 hover:bg-gray-50"}`}>
              {t === "team" ? "Team" : t === "tasks" ? cap(T.tasks) : cap(t)}
            </button>
          ))}
        </div>
        {tab === "performance" && <PeriodPicker value={w.period} onChange={w.setPeriod} />}
      </div>

      {tab === "performance" && <Panel><KpiBreakdown result={kpi} /></Panel>}

      {tab === "team" && (
        <Panel title={`${cap(T.workers)} under ${sup.name.split(" ")[0]}`} subtitle="The supervisor also manages this list from the mobile app" bodyClassName="p-0">
          <form
            className="flex flex-wrap gap-2 border-b border-gray-50 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!wName.trim()) return;
              w.addWorker({ name: wName.trim(), phone: wPhone.trim() || undefined, supervisorId: sup.id, locationId: sup.locationIds[0] });
              setWName(""); setWPhone("");
            }}
          >
            <input className={`${inputCls} max-w-xs`} placeholder={`${cap(T.worker)} name`} value={wName} onChange={(e) => setWName(e.target.value)} />
            <input className={`${inputCls} max-w-[180px]`} placeholder="Phone (optional)" value={wPhone} onChange={(e) => setWPhone(e.target.value)} />
            <button className={btnPrimary} disabled={!wName.trim()}>Add</button>
          </form>
          {team.length === 0 ? <Empty title={`No ${lower(T.workers)} yet`} /> : (
            <ul className="divide-y divide-gray-50">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className={m.status === "inactive" ? "text-gray-400 line-through" : "text-gray-800"}>{m.name}{m.phone ? <span className="ml-2 text-xs text-gray-400">{m.phone}</span> : null}</span>
                  <button className="text-xs font-medium text-[#1658E5]" onClick={() => w.updateWorker(m.id, { status: m.status === "active" ? "inactive" : "active" })}>
                    {m.status === "active" ? "Deactivate" : "Reactivate"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "tasks" && (
        <Panel bodyClassName="p-0" actions={<Link className="text-xs font-medium text-[#1658E5]" to={`${BASE}/tasks?supervisor=${sup.id}`}>Open in {lower(T.tasks)}</Link>}>
          {tasks.length === 0 ? <Empty title={`No ${lower(T.tasks)} assigned`} /> : (
            <ul className="divide-y divide-gray-50">
              {tasks.map((t) => (
                <li key={t.id} className="grid items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_140px_100px]">
                  <div><span className="text-xs text-gray-400">{t.code}</span> <span className="font-medium text-gray-800">{t.title}</span><div className="text-xs text-gray-500">Due {fmtDate(t.dueAt)}</div></div>
                  <div><ProgressBar value={t.targetQuantity ? (t.submittedOutput / t.targetQuantity) * 100 : 0} /><div className="mt-1 text-[11px] text-gray-500">{t.submittedOutput}/{t.targetQuantity} {t.unit}</div></div>
                  <TaskStatusPill status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "reports" && (
        <Panel bodyClassName="p-0">
          {reports.length === 0 ? <Empty title="No daily reports yet" /> : (
            <ul className="divide-y divide-gray-50">
              {reports.slice(0, 15).map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{new Date(`${r.reportDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    <span className="ml-2 text-xs text-gray-500">{r.workersPresent}/{r.workersAssigned} present</span></span>
                  <span className="flex items-center gap-2">{r.source === "dashboard" && <Pill>Filed by admin</Pill>}<ReviewPill status={r.reviewStatus} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "pay" && (
        <Panel bodyClassName="p-0" actions={<Link className="text-xs font-medium text-[#1658E5]" to={`${BASE}/payroll`}>Go to payroll</Link>}>
          {pay.length === 0 ? <Empty title="No payroll records yet" message="Generate a period on the Payroll tab." /> : (
            <ul className="divide-y divide-gray-50">
              {pay.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{periodLabel(p.period)}<span className="ml-2 text-xs text-gray-500">KPI {p.kpiScore === null ? "N/A" : p.kpiScore.toFixed(0)}</span></span>
                  <span className="flex items-center gap-3"><strong>{money(netPay(p))}</strong><PayPill status={p.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <SupervisorSheet open={editing} onClose={() => setEditing(false)} supervisor={sup} />
    </div>
  );
};

export default SupervisorDetail;

import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { ymd } from "@/api/supervisor-kpi/dates";
import type { ReportReviewStatus } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import ReportForm, { formatAnswer } from "./ReportForm";
import { Avatar, Empty, Panel, Pill, ReviewPill, btnDanger, btnGhost, btnPrimary, cap, inputCls, lower, useTerms, WEEKDAY_NAMES } from "./ui";

const Reports: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const [params, setParams] = useSearchParams();
  const [filing, setFiling] = useState<string | null | undefined>(undefined); // undefined = closed, null = open w/o supervisor
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sup, setSup] = useState("all");

  const status = (params.get("filter") ?? "all") as "all" | ReportReviewStatus;
  const today = ymd(new Date());
  const isRequiredDay = w.config.report.requiredDays.includes(new Date().getDay());
  const active = w.supervisors.filter((s) => s.status === "active");
  const todays = w.reports.filter((r) => r.reportDate === today);

  const rows = useMemo(
    () =>
      w.reports
        .filter((r) => (status === "all" || r.reviewStatus === status) && (sup === "all" || r.supervisorId === sup))
        .sort((a, b) => b.reportDate.localeCompare(a.reportDate) || b.submittedAt.localeCompare(a.submittedAt)),
    [w.reports, status, sup],
  );

  const required = w.config.report.requiredDays.map((d) => WEEKDAY_NAMES[d]).join(", ");

  return (
    <div className="space-y-4">
      <Panel
        title="Today’s reporting"
        subtitle={isRequiredDay ? `Reports are due by ${String(w.config.report.cutoffHour).padStart(2, "0")}:59 · required ${required}` : `Not a required reporting day · required ${required}`}
        actions={<button className={btnPrimary} onClick={() => setFiling(null)}><Plus className="h-4 w-4" /> File on behalf</button>}
        bodyClassName="p-0"
      >
        {active.length === 0 ? <Empty title={`No active ${lower(T.supervisors)}`} /> : (
          <ul className="divide-y divide-gray-50">
            {active.map((s) => {
              const r = todays.find((x) => x.supervisorId === s.id);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-3"><Avatar name={s.name} />{s.name}</span>
                  {r ? <span className="flex items-center gap-2 text-xs text-gray-500">{r.workersPresent}/{r.workersAssigned} present <ReviewPill status={r.reviewStatus} /></span>
                    : isRequiredDay ? <span className="flex items-center gap-2"><Pill tone="amber">Not filed</Pill><button className="text-xs font-medium text-[#1658E5]" onClick={() => setFiling(s.id)}>File for them</button></span>
                    : <span className="text-xs text-gray-400">—</span>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap gap-2">
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { const n = new URLSearchParams(params); e.target.value === "all" ? n.delete("filter") : n.set("filter", e.target.value); setParams(n, { replace: true }); }}>
            <option value="all">All statuses</option>
            <option value="submitted">Awaiting review</option>
            <option value="approved">Approved</option>
            <option value="returned">Returned</option>
          </select>
          <select className={`${inputCls} w-auto`} value={sup} onChange={(e) => setSup(e.target.value)}>
            <option value="all">All {lower(T.supervisors)}</option>
            {w.supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </Panel>

      {rows.length === 0 ? (
        <Panel bodyClassName="p-0"><Empty title="No reports match" message="Reports submitted from the mobile app appear here for review." /></Panel>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const s = w.supervisors.find((x) => x.id === r.supervisorId);
            const loc = w.locations.find((l) => l.id === r.locationId);
            const open = expanded === r.id;
            const att = r.workersAssigned ? Math.round((r.workersPresent / r.workersAssigned) * 100) : null;
            return (
              <div key={r.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setExpanded(open ? null : r.id)}>
                  <div className="flex items-center gap-3">
                    <Avatar name={s?.name ?? "?"} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s?.name ?? "Unknown"} · {new Date(`${r.reportDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
                      <div className="text-xs text-gray-500">{loc?.name ?? "—"}{att !== null && ` · ${r.workersPresent}/${r.workersAssigned} present (${att}%)`}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.source === "dashboard" && <Pill>Filed by admin</Pill>}
                    <ReviewPill status={r.reviewStatus} />
                    {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-gray-50 px-4 py-3 text-sm">
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {w.config.report.fields.map((f) => (
                        <div key={f.id}><dt className="text-xs text-gray-500">{f.label}</dt><dd className="text-gray-800">{formatAnswer(f, r.answers[f.id])}</dd></div>
                      ))}
                    </dl>
                    {w.config.report.fields.length === 0 && <p className="text-xs text-gray-400">This workspace’s report form only collects attendance.</p>}
                    {r.reviewNote && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">Review note: {r.reviewNote}</p>}
                    {r.reviewStatus === "submitted" && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
                        <input className={`${inputCls} max-w-sm`} placeholder="Review note (required to return)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                        <button className={btnPrimary} onClick={() => w.reviewReport(r.id, "approved", notes[r.id] ?? "")}>Approve</button>
                        <button className={btnDanger} disabled={!(notes[r.id] ?? "").trim()} onClick={() => w.reviewReport(r.id, "returned", notes[r.id])}>Return for correction</button>
                      </div>
                    )}
                    {r.reviewStatus === "returned" && <button className={btnGhost} onClick={() => setFiling(r.supervisorId)}>File corrected report</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReportForm open={filing !== undefined} onClose={() => setFiling(undefined)} supervisorId={filing ?? undefined} />
    </div>
  );
};

export default Reports;

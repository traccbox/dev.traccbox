import React, { useState } from "react";
import { periodLabel } from "@/api/supervisor-kpi/dates";
import { useWorkforce } from "./store";
import KpiBreakdown from "./KpiBreakdown";
import { Avatar, BASE, Empty, Panel, PeriodPicker, ScoreBadge, btnPrimary, cap, inputCls, lower, useTerms } from "./ui";
import { Link } from "react-router-dom";

const KpiPage: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const metrics = w.config.kpi.filter((m) => m.enabled && m.weight > 0);
  const sups = w.supervisors.filter((s) => s.status === "active");
  const [sel, setSel] = useState<string>("");
  const selected = sups.find((s) => s.id === sel) ?? sups[0];

  const rows = sups
    .map((s) => ({ s, kpi: w.kpiFor(s.id) }))
    .sort((a, b) => (b.kpi.score ?? -1) - (a.kpi.score ?? -1));
  const manual = metrics.filter((m) => m.source === "manual");

  if (sups.length === 0) {
    return <Panel bodyClassName="p-0"><Empty title={`No active ${lower(T.supervisors)} to score`} action={{ label: `Add ${lower(T.supervisor)}`, to: `${BASE}/supervisors?new=1` }} /></Panel>;
  }
  if (metrics.length === 0) {
    return <Panel bodyClassName="p-0"><Empty title="The scorecard has no metrics" message="Choose what performance means for your business." action={{ label: "Configure scorecard", to: `${BASE}/setup?tab=scorecard` }} /></Panel>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">Scores for <strong className="text-gray-800">{periodLabel(w.period)}</strong> · metrics without evidence are skipped, never counted as zero.</p>
        <div className="flex items-center gap-2">
          <PeriodPicker value={w.period} onChange={w.setPeriod} />
          <Link to={`${BASE}/setup?tab=scorecard`} className="text-xs font-medium text-[#1658E5]">Edit scorecard</Link>
        </div>
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{cap(T.supervisor)}</th>
                {metrics.map((m) => <th key={m.id} className="px-3 py-3 text-center font-medium">{m.label}<div className="font-normal text-gray-400">{m.weight}%</div></th>)}
                <th className="px-4 py-3 text-center font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, kpi }) => (
                <tr key={s.id} onClick={() => setSel(s.id)} className={`cursor-pointer border-t border-gray-50 hover:bg-blue-50/40 ${selected?.id === s.id ? "bg-blue-50/60" : ""}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={s.name} /><span className="font-medium text-gray-900">{s.name}</span></div></td>
                  {metrics.map((m) => {
                    const c = kpi.components.find((x) => x.metricId === m.id);
                    return <td key={m.id} className="px-3 py-3 text-center text-xs text-gray-700">{c?.achievement == null ? <span className="text-gray-300">N/A</span> : `${c.achievement.toFixed(0)}%`}</td>;
                  })}
                  <td className="px-4 py-3 text-center"><ScoreBadge score={kpi.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selected && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title={`${selected.name} — how the score is built`} className="lg:col-span-2" actions={<Link className="text-xs font-medium text-[#1658E5]" to={`${BASE}/supervisors/${selected.id}`}>Profile</Link>}>
            <KpiBreakdown result={w.kpiFor(selected.id)} />
          </Panel>

          <Panel title="Manager scores" subtitle={`Judgement-based metrics for ${periodLabel(w.period)}`}>
            {manual.length === 0 ? (
              <p className="text-xs text-gray-500">No manager-scored metrics. Add one in Setup → Scorecard for things the app can’t measure automatically — e.g. customer feedback or leadership.</p>
            ) : (
              <div className="space-y-4">
                {manual.map((m) => {
                  const existing = w.manualScores.find((x) => x.supervisorId === selected.id && x.metricId === m.id && x.period === w.period);
                  return <ManualScoreRow key={`${selected.id}-${m.id}-${w.period}`} label={m.label} initial={existing?.score} initialNote={existing?.note}
                    onSave={(score, note) => w.setManualScore(selected.id, m.id, w.period, score, note)} />;
                })}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
};

const ManualScoreRow: React.FC<{ label: string; initial?: number; initialNote?: string; onSave: (score: number, note?: string) => void }> = ({ label, initial, initialNote, onSave }) => {
  const [score, setScore] = useState(initial === undefined ? "" : String(initial));
  const [note, setNote] = useState(initialNote ?? "");
  const n = Number(score);
  const ok = score !== "" && n >= 0 && n <= 100;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-800">{label}</div>
      <div className="flex gap-2">
        <input type="number" min={0} max={100} placeholder="0–100" className={`${inputCls} w-24`} value={score} onChange={(e) => setScore(e.target.value)} />
        <input placeholder="Note (optional)" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className={btnPrimary} disabled={!ok} onClick={() => onSave(n, note.trim() || undefined)}>{initial === undefined ? "Save score" : "Update score"}</button>
    </div>
  );
};

export default KpiPage;

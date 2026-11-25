import React, { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { enabledWeightTotal, normalizeWeights } from "@/api/supervisor-kpi/kpi";
import { uid } from "@/api/supervisor-kpi/presets";
import type { KpiMetricConfig, ReportAnswer, ReportField, ReportFieldType } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { FieldInput } from "./ReportForm";
import { Field, Panel, Pill, Toggle, WEEKDAY_NAMES, btnGhost, btnPrimary, inputCls, lower, useTerms } from "./ui";

const FIELD_TYPES: [ReportFieldType, string][] = [
  ["text", "Short text"], ["longtext", "Long text"], ["number", "Number"], ["yesno", "Yes / No"],
  ["rating", "Rating (1–5)"], ["select", "Choose one"], ["photo", "Photo"],
];

export const ReportBuilder: React.FC = () => {
  const { config, updateConfig } = useWorkforce();
  const T = useTerms();
  const r = config.report;
  const [preview, setPreview] = useState<Record<string, ReportAnswer | undefined>>({});
  const setReport = (patch: Partial<typeof r>) => updateConfig((c) => ({ ...c, report: { ...c.report, ...patch } }));
  const setField = (id: string, patch: Partial<ReportField>) => setReport({ fields: r.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  const move = (i: number, d: -1 | 1) => {
    const next = [...r.fields];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setReport({ fields: next });
  };
  const remove = (f: ReportField) => {
    const linked = config.kpi.filter((m) => m.fieldId === f.id);
    if (linked.length && !window.confirm(`“${f.label}” feeds the scorecard metric “${linked[0].label}”. Removing the question removes that metric too. Continue?`)) return;
    updateConfig((c) => ({ ...c, report: { ...c.report, fields: c.report.fields.filter((x) => x.id !== f.id) }, kpi: c.kpi.filter((m) => m.fieldId !== f.id) }));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Panel title="Rules" bodyClassName="space-y-4 p-4">
          <Toggle checked={r.includeAttendance} onChange={(v) => setReport({ includeAttendance: v })} label={`Ask for ${lower(T.workers)} assigned and present`} hint="Feeds the attendance metric on the scorecard." />
          <div>
            <div className="mb-1.5 text-xs font-medium text-gray-700">Report required on</div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_NAMES.map((d, i) => {
                const on = r.requiredDays.includes(i);
                return <button key={d} onClick={() => setReport({ requiredDays: on ? r.requiredDays.filter((x) => x !== i) : [...r.requiredDays, i].sort() })} className={`h-8 w-11 rounded-lg border text-xs font-medium ${on ? "border-[#1658E5] bg-blue-50 text-[#1658E5]" : "border-gray-200 text-gray-500"}`}>{d}</button>;
              })}
            </div>
          </div>
          <Field label="On time until" hint="Reports filed after this hour count as late (half credit)">
            <select className={`${inputCls} w-40`} value={r.cutoffHour} onChange={(e) => setReport({ cutoffHour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:59</option>)}
            </select>
          </Field>
        </Panel>

        <Panel title="Questions" subtitle="Asked every day in the mobile app, in this order" actions={<button className={btnGhost} onClick={() => setReport({ fields: [...r.fields, { id: uid("fld"), label: "New question", type: "text", required: false }] })}><Plus className="h-4 w-4" /> Add question</button>} bodyClassName="p-0">
          {r.fields.length === 0 && <p className="p-4 text-xs text-gray-400">No custom questions. The report only collects attendance.</p>}
          <ul className="divide-y divide-gray-50">
            {r.fields.map((f, i) => (
              <li key={f.id} className="space-y-2 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                  <input className={inputCls} value={f.label} onChange={(e) => setField(f.id, { label: e.target.value })} />
                  <select className={inputCls} value={f.type} onChange={(e) => setField(f.id, { type: e.target.value as ReportFieldType, options: e.target.value === "select" ? f.options ?? ["Option 1", "Option 2"] : undefined })}>
                    {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {f.type === "select" && <input className={inputCls} placeholder="Options, comma separated" value={(f.options ?? []).join(", ")} onChange={(e) => setField(f.id, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Toggle checked={f.required} onChange={(v) => setField(f.id, { required: v })} label="Required" />{config.kpi.some((m) => m.fieldId === f.id) && <Pill tone="blue">Used in scorecard</Pill>}</div>
                  <div className="flex gap-1">
                    <button className={btnGhost} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                    <button className={btnGhost} disabled={i === r.fields.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
                    <button className={btnGhost} onClick={() => remove(f)}><Trash2 className="h-4 w-4 text-red-500" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Live preview" subtitle="What the supervisor sees in the app" className="h-fit lg:col-span-2" bodyClassName="space-y-3 p-4">
        {r.includeAttendance && <div className="grid grid-cols-2 gap-2 text-xs text-gray-500"><div className="rounded-lg border border-dashed p-2">{T.workers} assigned</div><div className="rounded-lg border border-dashed p-2">{T.workers} present</div></div>}
        {r.fields.map((f) => (
          <Field key={f.id} label={f.label || "Untitled"} required={f.required}>
            <FieldInput field={f} value={preview[f.id]} onChange={(v) => setPreview({ ...preview, [f.id]: v })} />
          </Field>
        ))}
      </Panel>
    </div>
  );
};

export const ScorecardBuilder: React.FC = () => {
  const { config, updateConfig } = useWorkforce();
  const metrics = config.kpi;
  const total = enabledWeightTotal(metrics);
  const linkable = config.report.fields.filter((f) => (f.type === "rating" || f.type === "yesno") && !metrics.some((m) => m.fieldId === f.id));
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"manual" | string>("manual");
  const setMetrics = (fn: (m: KpiMetricConfig[]) => KpiMetricConfig[]) => updateConfig((c) => ({ ...c, kpi: fn(c.kpi) }));
  const patch = (id: string, p: Partial<KpiMetricConfig>) => setMetrics((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const add = () => {
    if (kind === "manual") {
      if (!label.trim()) return;
      setMetrics((ms) => [...ms, { id: uid("kpi"), label: label.trim(), description: "Scored by a manager each period.", weight: 0, enabled: true, source: "manual" }]);
    } else {
      const f = config.report.fields.find((x) => x.id === kind);
      if (!f) return;
      setMetrics((ms) => [...ms, { id: uid("kpi"), label: label.trim() || f.label, description: `Taken from the “${f.label}” question on the daily report.`, weight: 0, enabled: true, source: "report_field", fieldId: f.id }]);
    }
    setLabel(""); setKind("manual");
  };

  return (
    <div className="space-y-4">
      <Panel
        title="What does good performance look like?"
        subtitle="Enabled weights should total 100. Metrics with no evidence in a period are skipped and the rest are re-weighted."
        actions={<><span className={`text-sm font-semibold ${total === 100 ? "text-emerald-600" : "text-red-600"}`}>{total}% / 100%</span><button className={btnGhost} disabled={total === 100 || total === 0} onClick={() => setMetrics(normalizeWeights)}>Rebalance to 100</button></>}
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-gray-50">
          {metrics.map((m) => (
            <li key={m.id} className={`grid items-start gap-3 p-3 sm:grid-cols-[auto_1fr_90px_auto] ${m.enabled ? "" : "opacity-50"}`}>
              <input type="checkbox" className="mt-2.5 h-4 w-4 accent-[#1658E5]" checked={m.enabled} onChange={(e) => patch(m.id, { enabled: e.target.checked })} />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input className={`${inputCls} max-w-xs font-medium`} value={m.label} onChange={(e) => patch(m.id, { label: e.target.value })} />
                  {m.source === "system" && <Pill>Automatic</Pill>}
                  {m.source === "report_field" && <Pill tone="blue">From daily report</Pill>}
                  {m.source === "manual" && <Pill tone="purple">Manager score</Pill>}
                </div>
                <p className="text-xs text-gray-500">{m.description}</p>
              </div>
              <div className="relative"><input type="number" min={0} max={100} disabled={!m.enabled} className={`${inputCls} pr-6`} value={m.weight} onChange={(e) => patch(m.id, { weight: Math.max(0, Math.min(100, Number(e.target.value))) })} /><span className="pointer-events-none absolute right-2.5 top-2 text-xs text-gray-400">%</span></div>
              {m.source !== "system" ? <button className={btnGhost} onClick={() => setMetrics((ms) => ms.filter((x) => x.id !== m.id))}><Trash2 className="h-4 w-4 text-red-500" /></button> : <span />}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Add a metric" subtitle="Anything your business measures that the automatic metrics don’t cover">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Source" className="min-w-[240px]">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="manual">Manager score (you enter 0–100 each period)</option>
              {linkable.map((f) => <option key={f.id} value={f.id}>From daily report: {f.label}</option>)}
            </select>
          </Field>
          <Field label="Name" className="min-w-[200px]"><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "manual" ? "e.g. Customer satisfaction" : "Defaults to the question"} /></Field>
          <button className={btnPrimary} disabled={kind === "manual" && !label.trim()} onClick={add}><Plus className="h-4 w-4" /> Add</button>
        </div>
      </Panel>
    </div>
  );
};

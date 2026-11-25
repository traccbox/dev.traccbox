import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { INDUSTRY_PRESETS } from "@/api/supervisor-kpi/presets";
import type { BonusMode, IndustryKey, Terminology, WorkLocation, TaskTemplate } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { CURRENCIES } from "./Onboarding";
import { ReportBuilder, ScorecardBuilder } from "./SetupBuilders";
import { Empty, Field, Panel, Pill, Toggle, areaCls, btnDanger, btnGhost, btnPrimary, cap, inputCls, lower, useTerms } from "./ui";

const TABS = [
  ["business", "Business & wording"], ["locations", "Locations"], ["types", "Task types"],
  ["report", "Daily report form"], ["scorecard", "Scorecard"], ["pay", "Pay & access"], ["data", "Data"],
] as const;

const Setup: React.FC = () => {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("business");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? "bg-blue-50 text-[#1658E5]" : "text-gray-600 hover:bg-gray-50"}`}>{l}</button>
        ))}
      </div>
      {tab === "business" && <Business />}
      {tab === "locations" && <Locations />}
      {tab === "types" && <TaskTypes />}
      {tab === "report" && <ReportBuilder />}
      {tab === "scorecard" && <ScorecardBuilder />}
      {tab === "pay" && <PayAccess />}
      {tab === "data" && <DataTab />}
    </div>
  );
};

const TERM_ROWS: [keyof Terminology, keyof Terminology, string][] = [
  ["location", "locations", "Where work happens"], ["supervisor", "supervisors", "Mobile app users who run teams"],
  ["worker", "workers", "People the supervisor manages"], ["task", "tasks", "A unit of assigned work"],
];

const Business: React.FC = () => {
  const { config, updateConfig, applyIndustry } = useWorkforce();
  const [pick, setPick] = useState<IndustryKey | null>(null);
  const [unit, setUnit] = useState("");
  const setTerm = (k: keyof Terminology, v: string) => updateConfig((c) => ({ ...c, terms: { ...c.terms, [k]: v } }));

  return (
    <div className="space-y-5">
      <Panel title="Industry template" subtitle={`Currently: ${INDUSTRY_PRESETS.find((p) => p.key === config.industry)?.label}`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPick(p.key === pick ? null : p.key)} className={`rounded-xl border p-3 text-left text-sm ${pick === p.key ? "border-[#1658E5] bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"}`}>
              <div className="font-medium text-gray-900">{p.label}{p.key === config.industry && <span className="ml-2 text-xs text-[#1658E5]">current</span>}</div>
              <div className="text-xs text-gray-500">{p.blurb}</div>
            </button>
          ))}
        </div>
        {pick && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <span className="flex-1">Existing {lower(config.terms.tasks)}, reports and people are never deleted.</span>
            <button className={btnGhost} onClick={() => { applyIndustry(pick, "wording"); setPick(null); toast.success("Wording and units updated"); }}>Wording &amp; units only</button>
            <button className={btnPrimary} onClick={() => { if (window.confirm("Replace the report form, scorecard and task types with this template? Old report answers will no longer be listed.")) { applyIndustry(pick, "everything"); setPick(null); toast.success("Template applied"); } }}>Replace everything</button>
          </div>
        )}
      </Panel>

      <Panel title="Your wording" subtitle="Used across the dashboard and the mobile app">
        <div className="grid gap-4 sm:grid-cols-2">
          {TERM_ROWS.map(([s, p, hint]) => (
            <div key={s} className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 p-3">
              <p className="col-span-2 text-xs text-gray-500">{hint}</p>
              <Field label="Singular"><input className={inputCls} value={config.terms[s]} onChange={(e) => setTerm(s, e.target.value)} /></Field>
              <Field label="Plural"><input className={inputCls} value={config.terms[p]} onChange={(e) => setTerm(p, e.target.value)} /></Field>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Units of measure" subtitle="Suggested when assigning work. You can always type a new one.">
          <div className="flex flex-wrap gap-2">
            {config.units.map((u) => (
              <span key={u} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">{u}<button onClick={() => updateConfig((c) => ({ ...c, units: c.units.filter((x) => x !== u) }))}><X className="h-3 w-3 text-gray-400" /></button></span>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = unit.trim(); if (v && !config.units.includes(v)) updateConfig((c) => ({ ...c, units: [...c.units, v] })); setUnit(""); }}>
            <input className={inputCls} placeholder="Add a unit, e.g. pallets" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <button className={btnGhost}>Add</button>
          </form>
        </Panel>
        <Panel title="Currency">
          <select className={inputCls} value={config.currency.code} onChange={(e) => updateConfig((c) => ({ ...c, currency: { code: e.target.value } }))}>
            {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
          </select>
        </Panel>
      </div>
    </div>
  );
};

const Locations: React.FC = () => {
  const { locations, saveLocation } = useWorkforce();
  const T = useTerms();
  const [edit, setEdit] = useState<Partial<WorkLocation> | null>(null);
  const radius = edit?.geofenceRadius;

  return (
    <Panel title={cap(T.locations)} subtitle={`Where ${lower(T.supervisors)} operate. An optional geofence supports GPS-verified attendance later.`} actions={<button className={btnPrimary} onClick={() => setEdit({ name: "" })}><Plus className="h-4 w-4" /> Add {lower(T.location)}</button>} bodyClassName="p-0">
      {edit && (
        <div className="grid gap-3 border-b border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-4">
          <Field label="Name" required className="sm:col-span-2"><input className={inputCls} value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Code"><input className={inputCls} value={edit.code ?? ""} onChange={(e) => setEdit({ ...edit, code: e.target.value })} /></Field>
          <Field label="Geofence radius (m)"><input type="number" min={0} className={inputCls} value={radius ?? ""} onChange={(e) => setEdit({ ...edit, geofenceRadius: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          <Field label="Address" className="sm:col-span-2"><input className={inputCls} value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></Field>
          <Field label="Latitude"><input type="number" step="any" className={inputCls} value={edit.latitude ?? ""} onChange={(e) => setEdit({ ...edit, latitude: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          <Field label="Longitude"><input type="number" step="any" className={inputCls} value={edit.longitude ?? ""} onChange={(e) => setEdit({ ...edit, longitude: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          <div className="flex gap-2 sm:col-span-4"><button className={btnPrimary} disabled={!edit.name?.trim()} onClick={() => { saveLocation({ ...edit, name: edit.name!.trim() }); setEdit(null); }}>Save</button><button className={btnGhost} onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      )}
      {locations.length === 0 ? <Empty title={`No ${lower(T.locations)} yet`} /> : (
        <ul className="divide-y divide-gray-50">
          {locations.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div><span className={`font-medium ${l.status === "archived" ? "text-gray-400" : "text-gray-900"}`}>{l.name}</span> {l.code && <span className="text-xs text-gray-400">{l.code}</span>} {l.status === "archived" && <Pill>Archived</Pill>}
                <div className="text-xs text-gray-500">{[l.address, l.geofenceRadius ? `${l.geofenceRadius} m geofence` : ""].filter(Boolean).join(" · ")}</div></div>
              <div className="flex gap-2"><button className="text-xs font-medium text-[#1658E5]" onClick={() => setEdit(l)}>Edit</button>
                <button className="text-xs font-medium text-gray-500" onClick={() => saveLocation({ id: l.id, name: l.name, status: l.status === "active" ? "archived" : "active" })}>{l.status === "active" ? "Archive" : "Restore"}</button></div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const TaskTypes: React.FC = () => {
  const { templates, saveTemplate, removeTemplate, config } = useWorkforce();
  const T = useTerms();
  const [edit, setEdit] = useState<(Partial<TaskTemplate> & { checklistText?: string; target?: string }) | null>(null);
  const open = (t?: TaskTemplate) => setEdit(t ? { ...t, checklistText: t.checklist.join("\n"), target: t.defaultTarget ? String(t.defaultTarget) : "" } : { name: "", unit: config.units[0] ?? "", requiresReview: true, requiresEvidence: false, checklistText: "", target: "" });

  return (
    <Panel title={`${cap(T.task)} types`} subtitle={`Reusable recipes: unit, default target, review rules and checklist. Pick one when assigning a ${lower(T.task)}.`} actions={<button className={btnPrimary} onClick={() => open()}><Plus className="h-4 w-4" /> Add type</button>} bodyClassName="p-0">
      {edit && (
        <div className="grid gap-3 border-b border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-3">
          <Field label="Name" required><input className={inputCls} value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Unit" required><input list="wf-setup-units" className={inputCls} value={edit.unit ?? ""} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} /><datalist id="wf-setup-units">{config.units.map((u) => <option key={u} value={u} />)}</datalist></Field>
          <Field label="Default target"><input type="number" min={0} className={inputCls} value={edit.target ?? ""} onChange={(e) => setEdit({ ...edit, target: e.target.value })} /></Field>
          <Field label="Checklist (one per line)" className="sm:col-span-2"><textarea rows={3} className={areaCls} value={edit.checklistText ?? ""} onChange={(e) => setEdit({ ...edit, checklistText: e.target.value })} /></Field>
          <div className="space-y-2"><Toggle checked={!!edit.requiresReview} onChange={(v) => setEdit({ ...edit, requiresReview: v })} label="Needs review" /><Toggle checked={!!edit.requiresEvidence} onChange={(v) => setEdit({ ...edit, requiresEvidence: v })} label="Needs photo evidence" /></div>
          <div className="flex gap-2 sm:col-span-3">
            <button className={btnPrimary} disabled={!edit.name?.trim() || !edit.unit?.trim()} onClick={() => { saveTemplate({ id: edit.id, name: edit.name!.trim(), unit: edit.unit!.trim(), defaultTarget: Number(edit.target) > 0 ? Number(edit.target) : undefined, requiresReview: !!edit.requiresReview, requiresEvidence: !!edit.requiresEvidence, checklist: (edit.checklistText ?? "").split("\n").map((x) => x.trim()).filter(Boolean) }); setEdit(null); }}>Save</button>
            <button className={btnGhost} onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </div>
      )}
      {templates.length === 0 ? <Empty title={`No ${lower(T.task)} types`} message="You can still assign custom work without a type." /> : (
        <ul className="divide-y divide-gray-50">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div><div className="font-medium text-gray-900">{t.name}</div><div className="text-xs text-gray-500">{t.defaultTarget ? `${t.defaultTarget} ` : ""}{t.unit} · {t.requiresReview ? "reviewed" : "no review"}{t.requiresEvidence ? " · photo evidence" : ""}{t.checklist.length ? ` · ${t.checklist.length} checklist items` : ""}</div></div>
              <div className="flex gap-3"><button className="text-xs font-medium text-[#1658E5]" onClick={() => open(t)}>Edit</button><button className="text-xs font-medium text-red-500" onClick={() => window.confirm(`Delete “${t.name}”? Existing ${lower(T.tasks)} keep their details.`) && removeTemplate(t.id)}>Delete</button></div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const PayAccess: React.FC = () => {
  const { config, updateConfig } = useWorkforce();
  const T = useTerms();
  const p = config.pay;
  const setPay = (patch: Partial<typeof p>) => updateConfig((c) => ({ ...c, pay: { ...c.pay, ...patch } }));
  const perm = config.permissions;
  const setPerm = (k: keyof typeof perm, v: boolean) => updateConfig((c) => ({ ...c, permissions: { ...c.permissions, [k]: v } }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="KPI bonus" subtitle={`Fixed pay and the maximum bonus are set per ${lower(T.supervisor)}.`} bodyClassName="space-y-4 p-4">
        <Field label="How is the bonus calculated?">
          <select className={inputCls} value={p.bonusMode} onChange={(e) => setPay({ bonusMode: e.target.value as BonusMode })}>
            <option value="proportional">Proportional — KPI 80 pays 80% of the maximum bonus</option>
            <option value="tiered">Tiered — score bands pay fixed percentages</option>
            <option value="none">No performance bonus</option>
          </select>
        </Field>
        {p.bonusMode !== "none" && <Field label="No bonus below this KPI score"><input type="number" min={0} max={100} className={`${inputCls} w-28`} value={p.minScoreForBonus} onChange={(e) => setPay({ minScoreForBonus: Number(e.target.value) })} /></Field>}
        {p.bonusMode === "tiered" && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Tiers (highest matching band applies)</div>
            {p.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">KPI ≥</span><input type="number" min={0} max={100} className={`${inputCls} w-20`} value={t.minScore} onChange={(e) => setPay({ tiers: p.tiers.map((x, j) => (j === i ? { ...x, minScore: Number(e.target.value) } : x)) })} />
                <span className="text-gray-500">pays</span><input type="number" min={0} max={100} className={`${inputCls} w-20`} value={t.payoutPercent} onChange={(e) => setPay({ tiers: p.tiers.map((x, j) => (j === i ? { ...x, payoutPercent: Number(e.target.value) } : x)) })} /><span className="text-gray-500">%</span>
                <button onClick={() => setPay({ tiers: p.tiers.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            ))}
            <button className={btnGhost} onClick={() => setPay({ tiers: [...p.tiers, { minScore: 50, payoutPercent: 25 }] })}><Plus className="h-4 w-4" /> Add tier</button>
          </div>
        )}
      </Panel>

      <Panel title={`What ${lower(T.supervisors)} can do in the app`} subtitle="Enforced by the backend and the mobile app" bodyClassName="space-y-4 p-4">
        <Toggle checked={perm.manageTeam} onChange={(v) => setPerm("manageTeam", v)} label={`Add and remove their own ${lower(T.workers)}`} />
        <Toggle checked={perm.createTasks} onChange={(v) => setPerm("createTasks", v)} label={`Create ${lower(T.tasks)} themselves`} hint="Otherwise only admins assign work." />
        <Toggle checked={perm.reassignTasks} onChange={(v) => setPerm("reassignTasks", v)} label={`Reassign ${lower(T.tasks)} between their ${lower(T.workers)}`} />
        <Toggle checked={perm.reviewOwnTasks} onChange={(v) => setPerm("reviewOwnTasks", v)} label="Approve their own work" hint="Turn off to keep an independent review step." />
      </Panel>
    </div>
  );
};

const DataTab: React.FC = () => {
  const { config, completeSetup, resetWorkspace } = useWorkforce();
  return (
    <Panel title="Workspace data" subtitle="Until the backend is connected, data is stored in this browser only." bodyClassName="space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        <button className={btnGhost} onClick={() => window.confirm("Replace everything with fresh sample data for your industry?") && completeSetup({ industry: config.industry, currency: config.currency.code, withSample: true })}>Reload sample data</button>
        <button className={btnDanger} onClick={() => window.confirm("Delete all supervisors, tasks, reports and payroll and return to setup?") && resetWorkspace()}>Erase everything &amp; start over</button>
      </div>
    </Panel>
  );
};

export default Setup;

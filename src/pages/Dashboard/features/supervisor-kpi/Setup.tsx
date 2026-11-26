import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { getPreset } from "@/api/supervisor-kpi/presets";
import { isNameTaken, locationInUse } from "@/api/supervisor-kpi/workspaces";
import type { BonusMode, Terminology, WorkLocation, TaskTemplate } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import { useLocationOptions } from "./useWorkAreas";
import LocationPicker from "./LocationPicker";
import CreateWorkArea from "./CreateWorkArea";
import { CURRENCIES } from "./Onboarding";
import { ReportBuilder, ScorecardBuilder } from "./SetupBuilders";
import { BASE, Empty, Field, Panel, Pill, Toggle, areaCls, btnDanger, btnGhost, btnPrimary, cap, inputCls, lower, useTerms } from "./ui";

const TABS = [
  ["business", "Workspace & wording"], ["locations", "Locations"], ["types", "Task types"],
  ["report", "Daily report form"], ["scorecard", "Scorecard"], ["pay", "Pay & access"], ["data", "Data"],
] as const;

const Setup: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const T = useTerms();
  const tab = TABS.find(([k]) => k === params.get("tab"))?.[0] ?? "business";
  const setTab = (k: string) => setParams({ tab: k }, { replace: true });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? "bg-blue-50 text-[#1658E5]" : "text-gray-600 hover:bg-gray-50"}`}>{k === "locations" ? cap(T.locations) : l}</button>
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
  const { id, name, workspaces, config, updateConfig, renameWorkspace } = useWorkforce();
  const nav = useNavigate();
  const [unit, setUnit] = useState("");
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name, id]);
  const setTerm = (k: keyof Terminology, v: string) => updateConfig((c) => ({ ...c, terms: { ...c.terms, [k]: v } }));
  const nameError = !draft.trim() ? "Name can’t be empty" : isNameTaken(draft, workspaces, id) ? "Another workspace uses this name" : "";

  return (
    <div className="space-y-5">
      <Panel
        title="This workspace"
        subtitle={`Industry: ${getPreset(config.industry).label}`}
        actions={<button className={btnPrimary} onClick={() => nav(`${BASE}/workspaces/new`)}><Plus className="h-4 w-4" /> Add another industry</button>}
      >
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Workspace name" className="w-full max-w-sm">
            <input className={`${inputCls} ${nameError ? "border-red-300" : ""}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <button className={btnGhost} disabled={!!nameError || draft.trim() === name} onClick={() => { renameWorkspace(id, draft.trim()); toast.success("Workspace renamed"); }}>Rename</button>
        </div>
        {nameError && <p className="mt-1 text-[11px] text-red-600">{nameError}</p>}
        <p className="mt-3 text-xs text-gray-500">
          Running another line of business? Add it as a separate workspace — this one stays as it is.{" "}
          <Link to={`${BASE}/workspaces`} className="font-medium text-[#1658E5]">See all workspaces ({workspaces.length})</Link>
        </p>
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
  const ws = useWorkforce();
  const T = useTerms();
  const confirm = useConfirm();
  const { toLink, isError, retry, canCreate } = useLocationOptions();
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const remove = async (l: WorkLocation) => {
    const use = locationInUse(ws, l.id);
    if (use) {
      await confirm({
        tone: "info",
        title: `${l.name} is still in use`,
        message: `It has ${use.supervisors} ${lower(use.supervisors === 1 ? T.supervisor : T.supervisors)} assigned and ${use.tasks} open ${lower(use.tasks === 1 ? T.task : T.tasks)}. Move or finish those first.`,
      });
      return;
    }
    const ok = await confirm({
      title: `Remove ${l.name} from this workspace?`,
      message: l.source === "work_area" ? "The work area itself is not deleted. It stays in the Work Areas module." : "This sample entry will be removed.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (ok) ws.unlinkLocation(l.id);
  };

  return (
    <>
      <Panel
        title={cap(T.locations)}
        subtitle={`Taken from your Work Areas, so geofences and attendance stay in one place.`}
        actions={
          <>
            <Link to="/dashboard/work-areas" className="text-xs font-medium text-[#1658E5]">Manage in Work Areas</Link>
            <button className={btnGhost} onClick={() => { setAdding((a) => !a); setPicked([]); }}>Add existing</button>
            {canCreate && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New {lower(T.location)}</button>}
          </>
        }
        bodyClassName="p-0"
      >
        {adding && (
          <div className="space-y-3 border-b border-gray-100 bg-gray-50/60 p-4">
            <div className="max-w-xl bg-white"><LocationPicker othersOnly selected={picked} onChange={setPicked} onCreate={() => setCreating(true)} /></div>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={!picked.length} onClick={() => { ws.linkLocations(toLink(picked)); toast.success(`${picked.length} added`); setPicked([]); setAdding(false); }}>Add selected{picked.length ? ` (${picked.length})` : ""}</button>
              <button className={btnGhost} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
        {isError && <p className="border-b border-gray-100 bg-red-50 px-4 py-2 text-xs text-red-700">Couldn’t reach Work Areas, so details may be out of date. <button className="font-semibold underline" onClick={retry}>Try again</button></p>}
        {ws.locations.length === 0 ? (
          <Empty title={`No ${lower(T.locations)} yet`} message="Add an existing work area, or create a new one." action={canCreate ? { label: `New ${lower(T.location)}`, onClick: () => setCreating(true) } : undefined} />
        ) : (
          <ul className="divide-y divide-gray-50">
            {ws.locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <span className={`font-medium ${l.status === "archived" ? "text-gray-400" : "text-gray-900"}`}>{l.name}</span>{" "}
                  {l.source === "work_area" ? <Pill tone="blue">Work area</Pill> : <Pill>Sample</Pill>} {l.status === "archived" && <Pill tone="amber">Inactive</Pill>}
                  <div className="text-xs text-gray-500">{[l.address, l.geofenceRadius ? `${Math.round(l.geofenceRadius)} m geofence` : ""].filter(Boolean).join(" · ")}</div>
                </div>
                <button className="text-xs font-medium text-red-500" onClick={() => remove(l)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {creating && <CreateWorkArea onDone={() => { setCreating(false); setAdding(false); }} />}
    </>
  );
};

const TaskTypes: React.FC = () => {
  const { templates, saveTemplate, removeTemplate, config } = useWorkforce();
  const T = useTerms();
  const confirm = useConfirm();
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
              <div className="flex gap-3"><button className="text-xs font-medium text-[#1658E5]" onClick={() => open(t)}>Edit</button><button className="text-xs font-medium text-red-500" onClick={async () => (await confirm({ title: `Delete “${t.name}”?`, message: `Existing ${lower(T.tasks)} keep their details.`, confirmLabel: "Delete", tone: "danger" })) && removeTemplate(t.id)}>Delete</button></div>
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
  const { id, name, reloadSampleData, deleteWorkspace } = useWorkforce();
  const confirm = useConfirm();
  const nav = useNavigate();

  const reload = async () => {
    const ok = await confirm({
      title: "Replace this workspace with sample data?",
      message: <>Supervisors, teams, {" "}tasks, reports, scores and payroll in <strong>{name}</strong> are replaced. Your setup and other workspaces are not touched.</>,
      confirmLabel: "Replace data",
      tone: "danger",
    });
    if (ok) { reloadSampleData(); toast.success("Sample data loaded"); }
  };
  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${name}?`,
      message: "This permanently deletes the workspace with its setup, people, tasks, reports and payroll. Other workspaces and your Work Areas are not affected.",
      confirmLabel: "Delete workspace",
      tone: "danger",
      requireText: name,
    });
    if (ok) { nav(BASE, { replace: true }); deleteWorkspace(id); toast.success(`${name} deleted`); }
  };

  return (
    <Panel title="Workspace data" subtitle="Until the backend is connected, data is stored in this browser only." bodyClassName="space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        <button className={btnGhost} onClick={reload}>Load sample data</button>
        <button className={btnDanger} onClick={remove}>Delete this workspace</button>
      </div>
    </Panel>
  );
};

export default Setup;

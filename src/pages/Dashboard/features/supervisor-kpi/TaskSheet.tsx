import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TaskPriority } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { Field, Toggle, areaCls, btnGhost, btnPrimary, cap, inputCls, lower, toLocalInput, useTerms } from "./ui";

const iso = (d: Date) => toLocalInput(d.toISOString());
const initial = () => {
  const start = new Date(); start.setHours(8, 0, 0, 0);
  const due = new Date(start); due.setDate(due.getDate() + 3); due.setHours(17);
  return {
    templateId: "", title: "", description: "", supervisorId: "", locationId: "", workerIds: [] as string[], unit: "", target: "",
    priority: "normal" as TaskPriority, startsAt: iso(start), dueAt: iso(due), requiresReview: true, requiresEvidence: false, checklist: "",
  };
};

/** Assign a new task to a supervisor. Task types pre-fill unit, target, review rules and checklist. */
const TaskSheet: React.FC<{ open: boolean; onClose: () => void; presetSupervisor?: string }> = ({ open, onClose, presetSupervisor }) => {
  const { supervisors, locations, workers, templates, config, addTask } = useWorkforce();
  const T = useTerms();
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(false);
  const activeSups = supervisors.filter((s) => s.status === "active");

  useEffect(() => {
    if (open) { setF({ ...initial(), supervisorId: presetSupervisor ?? "" }); setTouched(false); }
  }, [open, presetSupervisor]);

  const sup = supervisors.find((s) => s.id === f.supervisorId);
  const team = workers.filter((x) => x.supervisorId === f.supervisorId && x.status === "active");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const pickTemplate = (id: string) => {
    const tpl = templates.find((x) => x.id === id);
    setF(tpl
      ? { ...f, templateId: id, title: f.title || tpl.name, unit: tpl.unit, target: tpl.defaultTarget ? String(tpl.defaultTarget) : f.target, requiresReview: tpl.requiresReview, requiresEvidence: tpl.requiresEvidence, checklist: tpl.checklist.join("\n") }
      : { ...f, templateId: "" });
  };
  const pickSupervisor = (id: string) => {
    const s = supervisors.find((x) => x.id === id);
    setF({ ...f, supervisorId: id, locationId: s?.locationIds[0] ?? "", workerIds: [] });
  };

  const errors = {
    title: !f.title.trim(), supervisor: !f.supervisorId, location: !f.locationId, unit: !f.unit.trim(),
    target: !(Number(f.target) > 0), due: !f.dueAt || new Date(f.dueAt) <= new Date(f.startsAt),
  };
  const valid = !Object.values(errors).some(Boolean);
  const bad = (k: keyof typeof errors) => touched && errors[k] && "border-red-300";

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const t = addTask({
      title: f.title.trim(), description: f.description.trim(), templateId: f.templateId || undefined, locationId: f.locationId,
      supervisorId: f.supervisorId, workerIds: f.workerIds, unit: f.unit.trim(), targetQuantity: Number(f.target), priority: f.priority,
      requiresReview: f.requiresReview, requiresEvidence: f.requiresEvidence, startsAt: new Date(f.startsAt).toISOString(),
      dueAt: new Date(f.dueAt).toISOString(), checklist: f.checklist.split("\n").map((x) => x.trim()).filter(Boolean),
    });
    toast.success(`${t.code} assigned to ${sup?.name}`, { description: "It appears in their mobile app immediately." });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Assign {lower(T.task)}</SheetTitle>
          <SheetDescription>Start from a {lower(T.task)} type to pre-fill the unit, target, review rules and checklist.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <Field label={`${cap(T.task)} type`}>
            <select className={inputCls} value={f.templateId} onChange={(e) => pickTemplate(e.target.value)}>
              <option value="">Custom (no template)</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.unit}</option>)}
            </select>
          </Field>
          <Field label="Title" required><input className={`${inputCls} ${bad("title") || ""}`} value={f.title} onChange={set("title")} /></Field>
          <Field label="Description" hint="Clear instructions raise the planning score on the scorecard"><textarea rows={2} className={areaCls} value={f.description} onChange={set("description")} /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={cap(T.supervisor)} required>
              <select className={`${inputCls} ${bad("supervisor") || ""}`} value={f.supervisorId} onChange={(e) => pickSupervisor(e.target.value)}>
                <option value="">Select…</option>
                {activeSups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {activeSups.length === 0 && <span className="text-[11px] text-amber-600">No active {lower(T.supervisors)} yet.</span>}
            </Field>
            <Field label={cap(T.location)} required>
              <select className={`${inputCls} ${bad("location") || ""}`} value={f.locationId} onChange={set("locationId")}>
                <option value="">Select…</option>
                {locations.filter((l) => l.status === "active").map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Target quantity" required><input type="number" min={0} className={`${inputCls} ${bad("target") || ""}`} value={f.target} onChange={set("target")} /></Field>
            <Field label="Unit of measure" required hint="Output is compared per unit, never mixed across units">
              <input list="wf-units" className={`${inputCls} ${bad("unit") || ""}`} value={f.unit} onChange={set("unit")} />
              <datalist id="wf-units">{config.units.map((u) => <option key={u} value={u} />)}</datalist>
            </Field>
            <Field label="Starts"><input type="datetime-local" className={inputCls} value={f.startsAt} onChange={set("startsAt")} /></Field>
            <Field label="Due" required><input type="datetime-local" className={`${inputCls} ${bad("due") || ""}`} value={f.dueAt} onChange={set("dueAt")} />{touched && errors.due && <span className="text-[11px] text-red-600">Due must be after the start</span>}</Field>
            <Field label="Priority">
              <select className={inputCls} value={f.priority} onChange={set("priority")}>
                {(["low", "normal", "high", "urgent"] as const).map((p) => <option key={p} value={p}>{cap(p)}</option>)}
              </select>
            </Field>
          </div>

          {sup && (
            <Field label={`${cap(T.workers)} on this ${lower(T.task)}`} hint={team.length === 0 ? `${sup.name} has no ${lower(T.workers)} yet — add them on their profile.` : undefined}>
              <div className="flex flex-wrap gap-2">
                {team.map((m) => {
                  const on = f.workerIds.includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => setF({ ...f, workerIds: on ? f.workerIds.filter((x) => x !== m.id) : [...f.workerIds, m.id] })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-[#1658E5] bg-blue-50 text-[#1658E5]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="Checklist" hint="One item per line. The supervisor ticks these off in the app."><textarea rows={3} className={areaCls} value={f.checklist} onChange={set("checklist")} /></Field>
          <div className="space-y-2 rounded-xl bg-gray-50 p-3">
            <Toggle checked={f.requiresReview} onChange={(v) => setF({ ...f, requiresReview: v })} label="Needs review before it counts as done" hint="You (or a reviewer) accept the output; otherwise submitting completes it." />
            <Toggle checked={f.requiresEvidence} onChange={(v) => setF({ ...f, requiresEvidence: v })} label="Progress needs photo evidence" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} onClick={submit}>Assign {lower(T.task)}</button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSheet;

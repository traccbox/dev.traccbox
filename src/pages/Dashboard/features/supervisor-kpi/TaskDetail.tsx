import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { planningScore } from "@/api/supervisor-kpi/kpi";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import { Field, Panel, PriorityPill, Pill, ProgressBar, TaskStatusPill, areaCls, btnDanger, btnGhost, btnPrimary, fmtDateTime, inputCls, lower, useTerms } from "./ui";

const TaskDetail: React.FC<{ taskId: string | null; onClose: () => void }> = ({ taskId, onClose }) => {
  const w = useWorkforce();
  const confirm = useConfirm();
  const T = useTerms();
  const task = w.tasks.find((t) => t.id === taskId);
  const [inc, setInc] = useState("");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [approved, setApproved] = useState("");
  const [reason, setReason] = useState("");

  if (!task) return <Sheet open={false}><SheetContent /></Sheet>;
  const sup = w.supervisors.find((s) => s.id === task.supervisorId);
  const loc = w.locations.find((l) => l.id === task.locationId);
  const team = task.workerIds.map((id) => w.workers.find((x) => x.id === id)?.name).filter(Boolean);
  const pct = task.targetQuantity ? (task.submittedOutput / task.targetQuantity) * 100 : 0;
  const overdue = !["completed", "cancelled"].includes(task.status) && new Date(task.dueAt) < new Date();
  const working = ["assigned", "in_progress", "rework"].includes(task.status);
  const incN = Number(inc);
  const plan = planningScore(task);
  const approvedN = approved === "" ? task.submittedOutput : Number(approved);

  const log = () => {
    w.logProgress(task.id, incN, note.trim(), evidence.trim() ? [evidence.trim()] : []);
    setInc(""); setNote(""); setEvidence("");
    toast.success("Progress recorded (admin entry)");
  };

  return (
    <Sheet open={!!taskId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <span className="text-xs text-gray-400">{task.code}</span>
            <TaskStatusPill status={task.status} />
            <PriorityPill priority={task.priority} />
            {overdue && <Pill tone="red">Overdue</Pill>}
          </div>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>{task.description || "No description."}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-xs">
            <div><dt className="text-gray-500">{T.supervisor}</dt><dd className="font-medium text-gray-800">{sup?.name ?? "—"}</dd></div>
            <div><dt className="text-gray-500">{T.location}</dt><dd className="font-medium text-gray-800">{loc?.name ?? "—"}</dd></div>
            <div><dt className="text-gray-500">Starts</dt><dd className="font-medium text-gray-800">{fmtDateTime(task.startsAt)}</dd></div>
            <div><dt className="text-gray-500">Due</dt><dd className={`font-medium ${overdue ? "text-red-600" : "text-gray-800"}`}>{fmtDateTime(task.dueAt)}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">{T.workers}</dt><dd className="font-medium text-gray-800">{team.join(", ") || "None assigned"}</dd></div>
            <div><dt className="text-gray-500">Planning checklist</dt><dd className="font-medium text-gray-800">{plan.toFixed(0)}% complete</dd></div>
            <div><dt className="text-gray-500">Review</dt><dd className="font-medium text-gray-800">{task.requiresReview ? "Required" : "Not required"}</dd></div>
          </dl>

          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-gray-700">Output</span><span className="text-gray-500">{task.submittedOutput} / {task.targetQuantity} {task.unit} ({Math.round(pct)}%)</span></div>
            <ProgressBar value={pct} tone={task.status === "completed" ? "green" : overdue ? "red" : "blue"} />
            {task.reviewedOutput > 0 && <p className="mt-1 text-xs text-gray-500">Reviewed {task.reviewedOutput} · accepted {task.approvedOutput} {task.unit} ({Math.round((task.approvedOutput / task.reviewedOutput) * 100)}% pass)</p>}
            {task.reviewNote && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Reviewer note: {task.reviewNote}</p>}
          </div>

          {task.checklist.length > 0 && (
            <Panel title="Checklist" bodyClassName="space-y-1.5 p-3">
              {task.checklist.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.done} onChange={() => w.toggleChecklist(task.id, c.id)} className="h-4 w-4 accent-[#1658E5]" />
                  <span className={c.done ? "text-gray-400 line-through" : "text-gray-800"}>{c.label}</span>
                </label>
              ))}
            </Panel>
          )}

          {working && (
            <Panel title="Log progress on behalf of the supervisor" subtitle="Normally logged from the mobile app. Admin entries are labelled in the history." bodyClassName="space-y-3 p-3">
              <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
                <Field label={`Output (${task.unit})`}><input type="number" min={1} className={inputCls} value={inc} onChange={(e) => setInc(e.target.value)} /></Field>
                <Field label="Note" required><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              </div>
              <Field label={task.requiresEvidence ? "Evidence (required)" : "Evidence"} hint="Photo reference or link"><input className={inputCls} value={evidence} onChange={(e) => setEvidence(e.target.value)} /></Field>
              <button className={btnPrimary} disabled={!(incN > 0) || !note.trim() || (task.requiresEvidence && !evidence.trim())} onClick={log}>Record progress</button>
            </Panel>
          )}

          {task.status === "under_review" && (
            <Panel title="Review submitted work" bodyClassName="space-y-3 p-3">
              <p className="text-xs text-gray-500">{sup?.name} submitted {task.submittedOutput} {task.unit}. Enter how much you accept.</p>
              <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
                <Field label={`Accepted (${task.unit})`}><input type="number" min={0} max={task.submittedOutput} className={inputCls} value={approved} placeholder={String(task.submittedOutput)} onChange={(e) => setApproved(e.target.value)} /></Field>
                <Field label="Note / rework reason"><textarea rows={1} className={areaCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={btnPrimary} disabled={!(approvedN >= 0 && approvedN <= task.submittedOutput)} onClick={() => { w.reviewTask(task.id, approvedN, reason.trim()); toast.success("Accepted and completed"); setApproved(""); setReason(""); }}>Accept &amp; complete</button>
                <button className={btnDanger} disabled={!reason.trim()} onClick={() => { w.returnTask(task.id, reason.trim()); toast("Returned for rework"); setReason(""); }}>Return for rework</button>
              </div>
            </Panel>
          )}

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            {working && task.submittedOutput > 0 && <button className={btnGhost} onClick={() => w.submitForReview(task.id)}>{task.requiresReview ? "Submit for review" : "Mark complete"}</button>}
            {working && <button className={btnGhost} onClick={() => w.setTaskStatus(task.id, "on_hold")}>Put on hold</button>}
            {task.status === "on_hold" && <button className={btnPrimary} onClick={() => w.setTaskStatus(task.id, "in_progress")}>Resume</button>}
            {["completed", "cancelled"].includes(task.status) && <button className={btnGhost} onClick={() => w.setTaskStatus(task.id, "in_progress")}>Reopen</button>}
            {!["completed", "cancelled"].includes(task.status) && <button className={btnDanger} onClick={async () => (await confirm({ title: `Cancel ${task.code}?`, message: "It stays in the history but no longer counts toward KPIs. You can reopen it later.", confirmLabel: `Cancel ${lower(T.task)}`, tone: "danger" })) && w.setTaskStatus(task.id, "cancelled")}>Cancel {lower(T.task)}</button>}
          </div>

          <Panel title={`History (${task.progress.length})`} bodyClassName="p-0">
            {task.progress.length === 0 ? <p className="p-4 text-xs text-gray-400">No progress recorded yet.</p> : (
              <ul className="divide-y divide-gray-50">
                {[...task.progress].reverse().map((p) => (
                  <li key={p.id} className="space-y-0.5 px-4 py-2.5 text-xs">
                    <div className="flex justify-between"><span className="font-medium text-gray-800">+{p.increment} → {p.cumulative} {task.unit}</span><span className="text-gray-400">{fmtDateTime(p.createdAt)}</span></div>
                    <div className="text-gray-500">{p.recordedBy} {p.source === "dashboard" && <Pill>Dashboard</Pill>} — {p.note}{p.evidence.length ? ` · ${p.evidence.join(", ")}` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetail;

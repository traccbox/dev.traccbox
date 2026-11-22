import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupervisorStore } from "./store";
import type { OperationalTask, OperationalTaskStatus } from "@/api/supervisor-kpi/types";

const STATUSES: ("all" | OperationalTaskStatus)[] = [
  "all", "assigned", "in_progress", "on_hold", "submitted", "under_inspection", "approved", "rework", "completed",
];

const TaskCard: React.FC<{ task: OperationalTask }> = ({ task: t }) => {
  const { addProgress, submitForInspection, inspect, returnForRework } = useSupervisorStore();
  const [inc, setInc] = useState("");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [approved, setApproved] = useState(String(t.submittedOutput));
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const incNum = Number(inc);
  const canLog = incNum > 0 && note.trim().length > 0;
  const canWork = ["assigned", "in_progress", "rework"].includes(t.status);
  const approvedNum = Number(approved);
  const pct = t.targetQuantity ? Math.min(100, Math.round((t.submittedOutput / t.targetQuantity) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t.id} · {t.title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{t.priority}</Badge>
            <Badge>{t.status.replace("_", " ")}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.siteName} · {t.assignedWorkers.join(", ")}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{t.description}</p>
        <div>
          <div className="h-2 overflow-hidden rounded bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
          <div className="mt-1 text-muted-foreground">
            {t.submittedOutput} / {t.targetQuantity} {t.unit} ({pct}%) · due {new Date(t.dueAt).toLocaleString()}
          </div>
        </div>
        {t.inspectionNote && <p className="rounded bg-muted p-2">Inspection note: {t.inspectionNote}</p>}

        {canWork && (
          <div className="grid gap-2 sm:grid-cols-4">
            <Input type="number" min={1} placeholder={`Output (${t.unit})`} value={inc} onChange={(e) => setInc(e.target.value)} />
            <Input placeholder="Note (required)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Input placeholder="Evidence (e.g. 2 photos)" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
            <Button disabled={!canLog} onClick={() => { addProgress(t.id, incNum, note.trim(), evidence.trim()); setInc(""); setNote(""); setEvidence(""); }}>
              Add progress
            </Button>
          </div>
        )}
        {canWork && t.submittedOutput > 0 && (
          <Button variant="outline" onClick={() => submitForInspection(t.id)}>Submit for inspection</Button>
        )}
        {t.status === "under_inspection" && (
          <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto_auto]">
            <Input type="number" min={0} max={t.submittedOutput} value={approved} onChange={(e) => setApproved(e.target.value)} aria-label="Approved output" />
            <Textarea rows={1} placeholder="Rework reason (required to return)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button disabled={!(approvedNum >= 0 && approvedNum <= t.submittedOutput)} onClick={() => inspect(t.id, approvedNum, reason.trim())}>Approve</Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={() => { returnForRework(t.id, reason.trim()); setReason(""); }}>Return for rework</Button>
          </div>
        )}

        <Button variant="link" className="h-auto p-0" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"} history ({t.progress.length})
        </Button>
        {open && (
          <ul className="space-y-1">
            {t.progress.length === 0 && <li className="text-muted-foreground">No progress recorded yet.</li>}
            {t.progress.map((p) => (
              <li key={p.id} className="border-l-2 pl-2">
                +{p.increment} → {p.cumulative} {t.unit} · {new Date(p.createdAt).toLocaleString()} · {p.recordedBy}
                <div className="text-muted-foreground">{p.note}{p.evidence.length ? ` (${p.evidence.join(", ")})` : ""}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const NewTask: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addTask, supervisors } = useSupervisorStore();
  const [title, setTitle] = useState("");
  const [sup, setSup] = useState(supervisors[0].id);
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [due, setDue] = useState("");
  const valid = title.trim() && Number(target) > 0 && unit.trim() && due;
  return (
    <Card>
      <CardContent className="grid gap-2 pt-6 sm:grid-cols-6">
        <Input className="sm:col-span-2" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="rounded-md border bg-background px-2 text-sm" value={sup} onChange={(e) => setSup(e.target.value)}>
          {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input type="number" min={1} placeholder="Target" value={target} onChange={(e) => setTarget(e.target.value)} />
        <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        <Button
          disabled={!valid}
          onClick={() => {
            const s = supervisors.find((x) => x.id === sup)!;
            addTask({
              id: `OPS-${2400 + Math.floor(Math.random() * 900) + 10}`, title: title.trim(), description: "", siteId: s.siteId, siteName: s.siteName,
              supervisorId: s.id, assignedWorkers: [], targetQuantity: Number(target), unit: unit.trim(), submittedOutput: 0, verifiedOutput: 0,
              inspectedOutput: 0, approvedOutput: 0, status: "assigned", priority: "normal", startsAt: new Date().toISOString(),
              dueAt: new Date(due).toISOString(), planningComplete: true, materials: [], progress: [],
            });
            onDone();
          }}
        >Create task</Button>
      </CardContent>
    </Card>
  );
};

const Tasks: React.FC = () => {
  const { tasks, supervisors } = useSupervisorStore();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [sup, setSup] = useState("all");
  const [creating, setCreating] = useState(false);
  const shown = tasks.filter((t) => (status === "all" || t.status === status) && (sup === "all" || t.supervisorId === sup));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={sup} onChange={(e) => setSup(e.target.value)}>
          <option value="all">All supervisors</option>
          {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button className="ml-auto" onClick={() => setCreating((c) => !c)}>{creating ? "Close" : "New task"}</Button>
      </div>
      {creating && <NewTask onDone={() => setCreating(false)} />}
      {shown.length === 0 && <p className="text-sm text-muted-foreground">No tasks match these filters.</p>}
      {shown.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
};

export default Tasks;

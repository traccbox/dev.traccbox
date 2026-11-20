import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupervisorStore } from "./store";

const Reports: React.FC = () => {
  const { reports, supervisors, addReport, reviewReport } = useSupervisorStore();
  const [filter, setFilter] = useState("all");
  const [sup, setSup] = useState(supervisors[0].id);
  const [f, setF] = useState({ assigned: "", present: "", target: "", actual: "", delay: "", quality: "", comments: "" });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const assigned = Number(f.assigned), present = Number(f.present);
  const valid = assigned > 0 && present >= 0 && present <= assigned && Number(f.target) >= 0 && Number(f.actual) >= 0 && f.target !== "" && f.actual !== "";
  const shown = reports.filter((r) => filter === "all" || r.reviewStatus === filter);

  const submit = () => {
    const s = supervisors.find((x) => x.id === sup)!;
    addReport({
      id: `DR-${1100 + reports.length + 1}`, supervisorId: s.id, supervisorName: s.name, siteId: s.siteId, siteName: s.siteName,
      reportDate: new Date().toISOString().slice(0, 10), workersAssigned: assigned, workersPresent: present, workersAbsent: assigned - present,
      tasksAssigned: 0, tasksInProgress: 0, tasksSubmitted: 0, tasksCompleted: 0, targetOutput: Number(f.target), actualOutput: Number(f.actual),
      delayNotes: f.delay, materialsAndEquipment: "", qualityAndSafetyNotes: f.quality, supervisorComments: f.comments,
      attendanceCompleteness: 100, allocationAccuracy: 100, issueResolution: 100, submittedAt: new Date().toISOString(), reviewStatus: "submitted",
    });
    setF({ assigned: "", present: "", target: "", actual: "", delay: "", quality: "", comments: "" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Submit daily report</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <select className="rounded-md border bg-background px-2 py-2 text-sm" value={sup} onChange={(e) => setSup(e.target.value)}>
            {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.siteName}</option>)}
          </select>
          <Input type="number" min={0} placeholder="Workers assigned" value={f.assigned} onChange={set("assigned")} />
          <Input type="number" min={0} placeholder="Workers present" value={f.present} onChange={set("present")} />
          <Input type="number" min={0} placeholder="Target output" value={f.target} onChange={set("target")} />
          <Input type="number" min={0} placeholder="Actual output" value={f.actual} onChange={set("actual")} />
          <Input placeholder="Delays" value={f.delay} onChange={set("delay")} />
          <Textarea className="sm:col-span-3" rows={2} placeholder="Quality & safety notes" value={f.quality} onChange={set("quality")} />
          <Textarea className="sm:col-span-3" rows={2} placeholder="Supervisor comments" value={f.comments} onChange={set("comments")} />
          {present > assigned && <p className="text-sm text-destructive sm:col-span-3">Present cannot exceed assigned.</p>}
          <Button className="sm:col-span-3" disabled={!valid} onClick={submit}>Submit report</Button>
        </CardContent>
      </Card>

      <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        {["all", "submitted", "approved", "returned"].map((s) => <option key={s}>{s}</option>)}
      </select>
      {shown.length === 0 && <p className="text-sm text-muted-foreground">No reports match.</p>}
      {shown.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{r.id} · {r.supervisorName} · {r.siteName} · {r.reportDate}</strong>
              <Badge>{r.reviewStatus}</Badge>
            </div>
            <div>Workers {r.workersPresent}/{r.workersAssigned} present · Output {r.actualOutput}/{r.targetOutput}</div>
            {r.delayNotes && <div>Delays: {r.delayNotes}</div>}
            {r.qualityAndSafetyNotes && <div>Quality/safety: {r.qualityAndSafetyNotes}</div>}
            {r.supervisorComments && <div>Comments: {r.supervisorComments}</div>}
            {r.reviewNote && <div className="text-muted-foreground">Review: {r.reviewNote}</div>}
            {r.reviewStatus === "submitted" && (
              <div className="flex flex-wrap gap-2">
                <Input className="max-w-xs" placeholder="Review note" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <Button onClick={() => reviewReport(r.id, "approved", notes[r.id] ?? "")}>Approve</Button>
                <Button variant="destructive" disabled={!(notes[r.id] ?? "").trim()} onClick={() => reviewReport(r.id, "returned", notes[r.id])}>Return</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Reports;

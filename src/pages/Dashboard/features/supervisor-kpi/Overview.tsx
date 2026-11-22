import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupervisorKpi } from "@/api/supervisor-kpi/kpi";
import { useSupervisorStore } from "./store";

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

const Overview: React.FC = () => {
  const { tasks, reports, payroll, supervisors } = useSupervisorStore();
  const now = new Date();
  const active = tasks.filter((t) => ["assigned", "in_progress", "rework", "on_hold"].includes(t.status));
  const overdue = active.filter((t) => new Date(t.dueAt) < now);
  const inspection = tasks.filter((t) => t.status === "under_inspection");
  const present = reports.reduce((s, r) => s + r.workersPresent, 0);
  const absent = reports.reduce((s, r) => s + r.workersAbsent, 0);
  const target = reports.reduce((s, r) => s + r.targetOutput, 0);
  const actual = reports.reduce((s, r) => s + r.actualOutput, 0);
  const pendingPay = payroll.filter((p) => p.status === "pending").length;

  const ranking = supervisors
    .map((s) => ({ s, kpi: getSupervisorKpi(s.id, tasks, reports) }))
    .sort((a, b) => (b.kpi.score ?? -1) - (a.kpi.score ?? -1));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Workers present / absent" value={`${present} / ${absent}`} />
        <Stat label="Active tasks" value={active.length} />
        <Stat label="Overdue tasks" value={overdue.length} />
        <Stat label="Awaiting inspection" value={inspection.length} />
        <Stat label="Output vs target" value={target ? `${Math.round((actual / target) * 100)}%` : "N/A"} />
        <Stat label="Daily reports" value={reports.length} />
        <Stat label="Reports to review" value={reports.filter((r) => r.reviewStatus === "submitted").length} />
        <Stat label="Payroll awaiting approval" value={pendingPay} />
      </div>
      <Card>
        <CardHeader><CardTitle>Supervisor ranking</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ranking.map(({ s, kpi }, i) => (
            <div key={s.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
              <span>{i + 1}. {s.name} <span className="text-muted-foreground">· {s.siteName}</span></span>
              <span className="font-medium">{kpi.score === null ? "N/A" : kpi.score.toFixed(1)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;

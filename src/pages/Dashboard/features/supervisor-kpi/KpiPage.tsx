import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupervisorKpi } from "@/api/supervisor-kpi/kpi";
import { useSupervisorStore } from "./store";

const KpiPage: React.FC = () => {
  const { supervisors, tasks, reports } = useSupervisorStore();
  const [id, setId] = useState(supervisors[0].id);
  const sup = supervisors.find((s) => s.id === id)!;
  const kpi = getSupervisorKpi(id, tasks, reports);
  const myTasks = tasks.filter((t) => t.supervisorId === id);
  const myReports = reports.filter((r) => r.supervisorId === id);

  return (
    <div className="space-y-4">
      <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={id} onChange={(e) => setId(e.target.value)}>
        {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-semibold">{kpi.score === null ? "N/A" : kpi.score.toFixed(1)}<span className="text-base text-muted-foreground"> / 100</span></div>
          <div className="text-sm text-muted-foreground">
            {sup.name} · {sup.siteName} · eligible weight {kpi.eligibleWeight}% (N/A components are redistributed)
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {kpi.components.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{c.label} <span className="text-muted-foreground">({c.weight}%)</span></CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="text-lg font-medium">{c.achievement === null ? "N/A" : `${c.achievement.toFixed(1)}%`}</div>
              <div>Weighted score: {c.weightedScore === null ? "N/A" : c.weightedScore.toFixed(1)}</div>
              <div className="text-muted-foreground">{c.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Underlying records</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {myTasks.map((t) => (
            <div key={t.id}>{t.id} · {t.title} · verified {t.verifiedOutput}/{t.targetQuantity} {t.unit} · approved {t.approvedOutput}/{t.inspectedOutput} inspected · {t.status.replace("_", " ")}</div>
          ))}
          {myReports.map((r) => (
            <div key={r.id}>{r.id} · {r.reportDate} · attendance {r.attendanceCompleteness}% · allocation {r.allocationAccuracy}% · issues {r.issueResolution}% · {r.reviewStatus}</div>
          ))}
          {myTasks.length + myReports.length === 0 && <div className="text-muted-foreground">No records yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiPage;

import { inRange, periodRange, ymd } from "./dates";
import type {
  DailyReport,
  KpiComponent,
  KpiMetricConfig,
  ManualScore,
  OperationalTask,
  ReportField,
  ReportTemplate,
  SupervisorKpiResult,
  SystemMetricKey,
} from "./types";

export const SYSTEM_METRICS: Record<
  SystemMetricKey,
  { label: string; description: string }
> = {
  plan_completeness: {
    label: "Task planning",
    description:
      "How completely tasks are set up when assigned: target, unit, schedule, description and team.",
  },
  output_achievement: {
    label: "Output vs target",
    description: "Reported output compared with each task's target (capped at 100% per task).",
  },
  quality_pass_rate: {
    label: "Quality pass rate",
    description: "Share of reviewed output that the reviewer accepted.",
  },
  on_time_delivery: {
    label: "On-time delivery",
    description: "Tasks finished by their deadline, out of tasks that were due.",
  },
  completion_rate: {
    label: "Task completion",
    description: "Tasks completed, out of tasks that were due in the period.",
  },
  attendance_rate: {
    label: "Team attendance",
    description: "Workers present ÷ workers assigned across submitted daily reports.",
  },
  report_compliance: {
    label: "Reporting discipline",
    description:
      "Daily reports filed on required days. On time = full credit, late = half, missing = none.",
  },
};

const pct = (part: number, total: number): number | null =>
  total > 0 ? Math.min(100, Math.max(0, (part / total) * 100)) : null;

const avg = (xs: number[]): number | null =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

/** Share of setup checks a task passes at the moment it is assigned (0–100). */
export function planningScore(task: OperationalTask): number {
  const checks = [
    task.targetQuantity > 0,
    task.unit.trim().length > 0,
    new Date(task.dueAt).getTime() > new Date(task.startsAt).getTime(),
    task.workerIds.length > 0,
    task.description.trim().length > 0,
  ];
  return (checks.filter(Boolean).length / checks.length) * 100;
}

/**
 * Weighted score with redistribution: a component with no evidence is "N/A"
 * and its weight is shared across the components that do have evidence, so a
 * supervisor is never scored 0 for something that simply has not happened yet.
 */
export function calculateWeightedKpi(components: KpiComponent[]): SupervisorKpiResult {
  const eligible = components.filter((c) => c.achievement !== null && c.evidenceCount > 0);
  const eligibleWeight = eligible.reduce((sum, c) => sum + c.weight, 0);

  if (eligibleWeight === 0) {
    return {
      score: null,
      eligibleWeight: 0,
      components: components.map((c) => ({ ...c, weightedScore: null })),
    };
  }

  const scored = components.map((c) => {
    if (c.achievement === null || c.evidenceCount === 0) return { ...c, weightedScore: null };
    const achievement = Math.min(100, Math.max(0, c.achievement));
    return { ...c, achievement, weightedScore: achievement * (c.weight / eligibleWeight) };
  });
  const score = scored.reduce((sum, c) => sum + (c.weightedScore ?? 0), 0);
  return { score, eligibleWeight, components: scored };
}

export interface KpiInput {
  supervisorId: string;
  period: string; // YYYY-MM
  tasks: OperationalTask[];
  reports: DailyReport[];
  manualScores: ManualScore[];
  metrics: KpiMetricConfig[];
  reportTemplate: ReportTemplate;
  now?: Date;
}

type Evidence = { achievement: number | null; evidenceCount: number; detail: string };

function systemMetric(key: SystemMetricKey, i: KpiInput, tasks: OperationalTask[], reports: DailyReport[]): Evidence {
  const now = i.now ?? new Date();
  // Cancelled work is neither credit nor penalty.
  const live = tasks.filter((t) => t.status !== "cancelled");
  const due = live.filter((t) => new Date(t.dueAt) <= now || t.status === "completed");

  switch (key) {
    case "plan_completeness": {
      const a = avg(live.map(planningScore));
      return { achievement: a, evidenceCount: live.length, detail: `${live.length} tasks checked against the planning checklist.` };
    }
    case "output_achievement": {
      const withTarget = live.filter((t) => t.targetQuantity > 0 && t.status !== "assigned");
      const a = avg(withTarget.map((t) => pct(t.submittedOutput, t.targetQuantity) ?? 0));
      return { achievement: a, evidenceCount: withTarget.length, detail: `${withTarget.length} started tasks; output compared per task and unit, never summed across units.` };
    }
    case "quality_pass_rate": {
      const reviewed = live.filter((t) => t.reviewedOutput > 0);
      const a = avg(reviewed.map((t) => pct(t.approvedOutput, t.reviewedOutput) ?? 0));
      return { achievement: a, evidenceCount: reviewed.length, detail: `${reviewed.length} reviewed tasks; work still awaiting review is not counted.` };
    }
    case "on_time_delivery": {
      const onTime = due.filter((t) => t.completedAt && new Date(t.completedAt) <= new Date(t.dueAt)).length;
      return { achievement: pct(onTime, due.length), evidenceCount: due.length, detail: `${onTime} of ${due.length} due tasks were completed by their deadline.` };
    }
    case "completion_rate": {
      const done = due.filter((t) => t.status === "completed").length;
      return { achievement: pct(done, due.length), evidenceCount: due.length, detail: `${done} of ${due.length} due tasks are completed.` };
    }
    case "attendance_rate": {
      const rs = reports.filter((r) => r.workersAssigned > 0);
      const present = rs.reduce((s, r) => s + r.workersPresent, 0);
      const assigned = rs.reduce((s, r) => s + r.workersAssigned, 0);
      return { achievement: pct(present, assigned), evidenceCount: rs.length, detail: `${present} present of ${assigned} assigned across ${rs.length} reports.` };
    }
    case "report_compliance": {
      const [start, end] = periodRange(i.period);
      const today = ymd(now);
      const byDate = new Map(reports.filter((r) => r.reviewStatus !== "returned").map((r) => [r.reportDate, r]));
      let expected = 0;
      let credit = 0;
      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = ymd(d);
        if (!i.reportTemplate.requiredDays.includes(d.getDay())) continue;
        const r = byDate.get(day);
        if (day > today || (day === today && !r)) continue; // not due yet
        expected += 1;
        if (!r) continue;
        const cutoff = new Date(`${day}T00:00:00`);
        cutoff.setHours(i.reportTemplate.cutoffHour, 59, 59, 999);
        credit += new Date(r.submittedAt) <= cutoff ? 1 : 0.5;
      }
      return { achievement: pct(credit, expected), evidenceCount: expected, detail: `${expected} required report days so far; returned reports count as missing.` };
    }
  }
}

function fieldMetric(field: ReportField | undefined, reports: DailyReport[]): Evidence {
  if (!field) return { achievement: null, evidenceCount: 0, detail: "The linked report question no longer exists." };
  const values = reports
    .map((r) => r.answers[field.id])
    .filter((v) => v !== undefined && v !== "");
  if (field.type === "rating") {
    const nums = values.map(Number).filter((n) => !Number.isNaN(n));
    return { achievement: avg(nums.map((n) => (n / 5) * 100)), evidenceCount: nums.length, detail: `Average of ${nums.length} “${field.label}” ratings out of 5.` };
  }
  if (field.type === "yesno") {
    const yes = values.filter((v) => v === true).length;
    return { achievement: pct(yes, values.length), evidenceCount: values.length, detail: `“${field.label}” answered yes on ${yes} of ${values.length} reports.` };
  }
  return { achievement: null, evidenceCount: 0, detail: "Only rating and yes/no questions can feed a KPI." };
}

export function getSupervisorKpi(input: KpiInput): SupervisorKpiResult {
  const range = periodRange(input.period);
  const tasks = input.tasks.filter((t) => t.supervisorId === input.supervisorId && inRange(t.dueAt, range));
  const reports = input.reports.filter(
    (r) => r.supervisorId === input.supervisorId && inRange(`${r.reportDate}T12:00:00`, range),
  );

  const components: KpiComponent[] = input.metrics
    .filter((m) => m.enabled && m.weight > 0)
    .map((m) => {
      let ev: Evidence;
      if (m.source === "system" && m.systemKey) {
        ev = systemMetric(m.systemKey, input, tasks, reports);
      } else if (m.source === "report_field") {
        ev = fieldMetric(input.reportTemplate.fields.find((f) => f.id === m.fieldId), reports);
      } else {
        const s = input.manualScores.find(
          (x) => x.supervisorId === input.supervisorId && x.metricId === m.id && x.period === input.period,
        );
        ev = s
          ? { achievement: s.score, evidenceCount: 1, detail: s.note || "Entered by a manager." }
          : { achievement: null, evidenceCount: 0, detail: "No manager score entered for this period." };
      }
      return {
        metricId: m.id,
        label: m.label,
        source: m.source,
        weight: m.weight,
        ...ev,
        weightedScore: null,
      };
    });

  return calculateWeightedKpi(components);
}

export const enabledWeightTotal = (metrics: KpiMetricConfig[]): number =>
  metrics.filter((m) => m.enabled).reduce((s, m) => s + (Number(m.weight) || 0), 0);

/** Rescale enabled weights to total exactly 100 (largest-remainder rounding). */
export function normalizeWeights(metrics: KpiMetricConfig[]): KpiMetricConfig[] {
  const on = metrics.filter((m) => m.enabled);
  const total = enabledWeightTotal(metrics);
  if (on.length === 0) return metrics;
  const raw = on.map((m) => (total > 0 ? (m.weight / total) * 100 : 100 / on.length));
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((s, x) => s + x, 0);
  raw
    .map((r, i) => ({ i, rem: r - floors[i] }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => {
      if (left > 0) {
        floors[i] += 1;
        left -= 1;
      }
    });
  const byId = new Map(on.map((m, i) => [m.id, floors[i]]));
  return metrics.map((m) => (byId.has(m.id) ? { ...m, weight: byId.get(m.id)! } : m));
}

import type {
  DailyProgressReport,
  KpiComponent,
  OperationalTask,
  SupervisorKpiResult,
} from "./types";

export const KPI_WEIGHTS = {
  planning: 25,
  productivity: 30,
  quality: 20,
  delivery: 15,
  workforce: 10,
} as const;

export const KPI_COMPONENT_LABELS = {
  planning: "Task assignment & planning",
  productivity: "Team productivity",
  quality: "Quality control",
  delivery: "Timely task delivery",
  workforce: "Workforce management & reporting",
} as const;

export function calculateWeightedKpi(components: KpiComponent[]): SupervisorKpiResult {
  const eligible = components.filter(
    (component) => component.achievement !== null && component.evidenceCount > 0,
  );
  const eligibleWeight = eligible.reduce((sum, component) => sum + component.weight, 0);

  if (eligibleWeight === 0) {
    return {
      score: null,
      eligibleWeight: 0,
      components: components.map((component) => ({ ...component, weightedScore: null })),
    };
  }

  const scored = components.map((component) => {
    if (component.achievement === null || component.evidenceCount === 0) {
      return { ...component, weightedScore: null };
    }
    const achievement = Math.min(100, Math.max(0, component.achievement));
    const redistributedWeight = (component.weight / eligibleWeight) * 100;
    return { ...component, achievement, weightedScore: achievement * (redistributedWeight / 100) };
  });
  const score = scored.reduce((sum, component) => sum + (component.weightedScore ?? 0), 0);

  return { score, eligibleWeight, components: scored };
}

const percentage = (part: number, total: number) =>
  total > 0 ? Math.min(100, (part / total) * 100) : null;

export function getSupervisorKpi(
  supervisorId: string,
  tasks: OperationalTask[],
  reports: DailyProgressReport[],
): SupervisorKpiResult {
  const assignedTasks = tasks.filter((task) => task.supervisorId === supervisorId);
  const supervisorReports = reports.filter((report) => report.supervisorId === supervisorId);

  const plannedTasks = assignedTasks.filter((task) => task.planningComplete).length;
  const productivityTasks = assignedTasks.filter((task) => task.verifiedOutput > 0 && task.targetQuantity > 0);
  const inspectedTasks = assignedTasks.filter((task) => task.inspectedOutput > 0);
  const dueTasks = assignedTasks.filter((task) => task.status === "approved" || task.status === "completed" || new Date(task.dueAt) <= new Date());
  const onTimeTasks = dueTasks.filter(
    (task) => task.approvedAt && new Date(task.approvedAt) <= new Date(task.dueAt),
  ).length;
  const workforceSignals = supervisorReports.flatMap((report) => [
    report.attendanceCompleteness,
    report.allocationAccuracy,
    report.issueResolution,
    report.reviewStatus === "submitted" || report.reviewStatus === "approved" ? 100 : 0,
  ]);

  const productivity = productivityTasks.length
    ? productivityTasks.reduce(
        (sum, task) => sum + (percentage(task.verifiedOutput, task.targetQuantity) ?? 0),
        0,
      ) / productivityTasks.length
    : null;
  const quality = inspectedTasks.length
    ? inspectedTasks.reduce(
        (sum, task) => sum + (percentage(task.approvedOutput, task.inspectedOutput) ?? 0),
        0,
      ) / inspectedTasks.length
    : null;
  const workforce = workforceSignals.length
    ? workforceSignals.reduce((sum, score) => sum + score, 0) / workforceSignals.length
    : null;

  const components: KpiComponent[] = [
    {
      key: "planning",
      label: KPI_COMPONENT_LABELS.planning,
      weight: KPI_WEIGHTS.planning,
      achievement: percentage(plannedTasks, assignedTasks.length),
      evidenceCount: assignedTasks.length,
      detail: `${plannedTasks} of ${assignedTasks.length} assigned tasks meet the planning checklist.`,
      weightedScore: null,
    },
    {
      key: "productivity",
      label: KPI_COMPONENT_LABELS.productivity,
      weight: KPI_WEIGHTS.productivity,
      achievement: productivity,
      evidenceCount: productivityTasks.length,
      detail: `${productivityTasks.length} tasks with verified output; output is compared per task and unit.`,
      weightedScore: null,
    },
    {
      key: "quality",
      label: KPI_COMPONENT_LABELS.quality,
      weight: KPI_WEIGHTS.quality,
      achievement: quality,
      evidenceCount: inspectedTasks.length,
      detail: `${inspectedTasks.length} inspected tasks; awaiting inspection is not counted as approved.`,
      weightedScore: null,
    },
    {
      key: "delivery",
      label: KPI_COMPONENT_LABELS.delivery,
      weight: KPI_WEIGHTS.delivery,
      achievement: percentage(onTimeTasks, dueTasks.length),
      evidenceCount: dueTasks.length,
      detail: `${onTimeTasks} of ${dueTasks.length} due tasks were approved by their deadline.`,
      weightedScore: null,
    },
    {
      key: "workforce",
      label: KPI_COMPONENT_LABELS.workforce,
      weight: KPI_WEIGHTS.workforce,
      achievement: workforce,
      evidenceCount: workforceSignals.length,
      detail: `${supervisorReports.length} daily reports and workforce management indicators.`,
      weightedScore: null,
    },
  ];

  return calculateWeightedKpi(components);
}
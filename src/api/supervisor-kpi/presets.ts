import { ymd } from "./dates";
import { SYSTEM_METRICS } from "./kpi";
import type {
  ChecklistItem,
  DailyReport,
  IndustryKey,
  KpiMetricConfig,
  OperationalTask,
  ReportField,
  ReportAnswer,
  Supervisor,
  SystemMetricKey,
  TaskTemplate,
  Terminology,
  TaskProgressEntry,
  WorkLocation,
  Worker,
  WorkspaceConfig,
  WorkspaceData,
} from "./types";

export const uid = (prefix: string): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

type FieldSeed = Omit<ReportField, "id">;
type TemplateSeed = Omit<TaskTemplate, "id">;

export interface IndustryPreset {
  key: IndustryKey;
  label: string;
  blurb: string;
  terms: Terminology;
  units: string[];
  templates: TemplateSeed[];
  fields: FieldSeed[];
  weights: Record<SystemMetricKey, number>;
  /** Optional KPI fed by one of this industry's rating / yes-no report questions. */
  fieldMetric?: { fieldLabel: string; label: string; weight: number };
  sample: {
    locations: string[];
    supervisors: { name: string; title: string }[];
    workers: string[];
    tasks: { template: number; title: string; target: number }[];
  };
}

const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5];
const WEEKDAYS_MON_SAT = [1, 2, 3, 4, 5, 6];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const t = (
  location: string,
  supervisor: string,
  worker: string,
  task: string,
  plurals: Partial<Terminology> = {},
): Terminology => ({
  location,
  locations: plurals.locations ?? `${location}s`,
  supervisor,
  supervisors: plurals.supervisors ?? `${supervisor}s`,
  worker,
  workers: plurals.workers ?? `${worker}s`,
  task,
  tasks: plurals.tasks ?? `${task}s`,
});

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    key: "construction",
    label: "Construction & Real Estate",
    blurb: "Sites, crews and measured work like blocks laid or area painted.",
    terms: t("Site", "Site Supervisor", "Worker", "Task"),
    units: ["blocks", "sq m", "cu m", "m", "bags", "units"],
    templates: [
      { name: "Block laying", unit: "blocks", defaultTarget: 1000, requiresReview: true, requiresEvidence: true, checklist: ["Materials on site", "Safety briefing done", "Setting out checked"] },
      { name: "Concrete works", unit: "cu m", defaultTarget: 40, requiresReview: true, requiresEvidence: true, checklist: ["Formwork inspected", "Mix approved"] },
      { name: "Painting & finishing", unit: "sq m", defaultTarget: 250, requiresReview: true, requiresEvidence: false, checklist: ["Surface prepared"] },
    ],
    fields: [
      { label: "Weather", type: "select", required: false, options: ["Clear", "Rain", "Extreme heat"] },
      { label: "Safety rating", type: "rating", required: true, help: "1 = unsafe, 5 = excellent" },
      { label: "Any safety incident?", type: "yesno", required: true },
      { label: "Materials & equipment issues", type: "longtext", required: false },
      { label: "Site photos", type: "photo", required: false },
    ],
    weights: { plan_completeness: 15, output_achievement: 25, quality_pass_rate: 20, on_time_delivery: 15, completion_rate: 0, attendance_rate: 10, report_compliance: 5 },
    fieldMetric: { fieldLabel: "Safety rating", label: "Safety performance", weight: 10 },
    sample: {
      locations: ["Ikeja Housing Project", "Lekki Estate Phase 2", "Victoria Island Office Fit-out"],
      supervisors: [{ name: "Adaeze Okafor", title: "Senior Site Supervisor" }, { name: "Tunde Balogun", title: "Site Supervisor" }, { name: "Musa Ibrahim", title: "Finishing Supervisor" }, { name: "Kelechi Nwachukwu", title: "Site Supervisor" }],
      workers: ["Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Tunde Bakare", "Fatima Yusuf", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Yemi Alade", "Bola Ige", "Sani Abubakar"],
      tasks: [{ template: 0, title: "Block laying — west wing", target: 1000 }, { template: 2, title: "Corridor screeding — block A", target: 250 }, { template: 1, title: "Column casting — level 2", target: 36 }, { template: 2, title: "Third-floor partition finishing", target: 120 }, { template: 0, title: "Perimeter wall", target: 600 }, { template: 1, title: "Slab pour — block B", target: 55 }],
    },
  },
  {
    key: "logistics",
    label: "Logistics & Warehousing",
    blurb: "Hubs, dispatch shifts and throughput like orders or trips completed.",
    terms: t("Hub", "Shift Supervisor", "Handler", "Job"),
    units: ["orders", "trips", "parcels", "pallets", "km", "kg"],
    templates: [
      { name: "Outbound dispatch", unit: "orders", defaultTarget: 120, requiresReview: true, requiresEvidence: false, checklist: ["Manifests printed", "Vehicles inspected"] },
      { name: "Inbound receiving", unit: "pallets", defaultTarget: 40, requiresReview: true, requiresEvidence: true, checklist: ["Delivery note matched"] },
      { name: "Last-mile delivery run", unit: "parcels", defaultTarget: 80, requiresReview: false, requiresEvidence: false, checklist: [] },
    ],
    fields: [
      { label: "Manifests fully verified", type: "yesno", required: true },
      { label: "Vehicles available", type: "number", required: true },
      { label: "Delays or incidents", type: "longtext", required: false },
      { label: "Customer complaints", type: "number", required: false },
    ],
    weights: { plan_completeness: 10, output_achievement: 25, quality_pass_rate: 15, on_time_delivery: 25, completion_rate: 0, attendance_rate: 10, report_compliance: 5 },
    fieldMetric: { fieldLabel: "Manifests fully verified", label: "Manifest accuracy", weight: 10 },
    sample: {
      locations: ["Lekki Distribution Hub", "Apapa Port Warehouse", "Ikorodu Cross-dock"],
      supervisors: [{ name: "Tunde Balogun", title: "Day Shift Lead" }, { name: "Ifeoma Chukwu", title: "Night Shift Lead" }, { name: "Dauda Lawal", title: "Receiving Lead" }, { name: "Rita Okoye", title: "Dispatch Lead" }],
      workers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Kunle Ajayi", "Hauwa Musa", "Peter Eze", "Sade Bello"],
      tasks: [{ template: 0, title: "Wholesale order dispatch", target: 120 }, { template: 1, title: "Container 4471 offload", target: 40 }, { template: 2, title: "Mainland delivery run", target: 80 }, { template: 0, title: "Retail restock dispatch", target: 90 }, { template: 1, title: "Inbound pallets — supplier B", target: 30 }, { template: 2, title: "Island delivery run", target: 70 }],
    },
  },
  {
    key: "retail",
    label: "Retail & Hospitality",
    blurb: "Stores, restaurants and hotels with shift managers and service quality.",
    terms: t("Store", "Shift Manager", "Team member", "Task", { locations: "Stores" }),
    units: ["items", "SKUs", "areas", "tables", "checks"],
    templates: [
      { name: "Shelf restocking", unit: "items", defaultTarget: 300, requiresReview: true, requiresEvidence: true, checklist: ["Planogram followed", "Expired stock removed"] },
      { name: "Stock count", unit: "SKUs", defaultTarget: 150, requiresReview: true, requiresEvidence: false, checklist: [] },
      { name: "Store cleaning & display", unit: "areas", defaultTarget: 8, requiresReview: false, requiresEvidence: true, checklist: ["Cleaning rota signed"] },
    ],
    fields: [
      { label: "Customer feedback rating", type: "rating", required: true },
      { label: "Footfall", type: "number", required: false },
      { label: "Opening checklist completed", type: "yesno", required: true },
      { label: "Stock-outs", type: "longtext", required: false },
    ],
    weights: { plan_completeness: 10, output_achievement: 20, quality_pass_rate: 15, on_time_delivery: 10, completion_rate: 10, attendance_rate: 10, report_compliance: 5 },
    fieldMetric: { fieldLabel: "Customer feedback rating", label: "Customer experience", weight: 20 },
    sample: {
      locations: ["Ikeja City Mall Store", "Lekki Phase 1 Store", "Abuja Wuse Store"],
      supervisors: [{ name: "Chiamaka Obi", title: "Store Manager" }, { name: "Femi Adekunle", title: "Shift Manager" }, { name: "Zainab Lawal", title: "Shift Manager" }, { name: "Obinna Eze", title: "Assistant Manager" }],
      workers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Kunle Ajayi", "Hauwa Musa", "Peter Eze", "Sade Bello"],
      tasks: [{ template: 0, title: "Beverage aisle restock", target: 300 }, { template: 1, title: "Weekly stock count — frozen", target: 150 }, { template: 2, title: "Pre-weekend store reset", target: 8 }, { template: 0, title: "Promo display setup", target: 200 }, { template: 1, title: "Cycle count — electronics", target: 90 }, { template: 2, title: "Fitting rooms & entrance", target: 5 }],
    },
  },
  {
    key: "manufacturing",
    label: "Manufacturing & Production",
    blurb: "Plants, lines and work orders measured in units produced and defects.",
    terms: t("Line", "Line Supervisor", "Operator", "Work order"),
    units: ["units", "batches", "cartons", "kg", "litres"],
    templates: [
      { name: "Assembly batch", unit: "units", defaultTarget: 500, requiresReview: true, requiresEvidence: false, checklist: ["Materials staged", "Machine calibrated"] },
      { name: "Packaging run", unit: "cartons", defaultTarget: 200, requiresReview: true, requiresEvidence: true, checklist: ["Labels verified"] },
      { name: "Quality audit", unit: "batches", defaultTarget: 6, requiresReview: false, requiresEvidence: false, checklist: [] },
    ],
    fields: [
      { label: "Safety compliance rating", type: "rating", required: true },
      { label: "Machine downtime (minutes)", type: "number", required: true },
      { label: "Defects found", type: "number", required: true },
      { label: "Shift handover notes", type: "longtext", required: false },
    ],
    weights: { plan_completeness: 10, output_achievement: 25, quality_pass_rate: 25, on_time_delivery: 15, completion_rate: 0, attendance_rate: 5, report_compliance: 5 },
    fieldMetric: { fieldLabel: "Safety compliance rating", label: "Safety compliance", weight: 15 },
    sample: {
      locations: ["Assembly Line 1", "Packaging Line 2", "Bottling Line 3"],
      supervisors: [{ name: "Ngozi Anyanwu", title: "Line Supervisor" }, { name: "Habib Garba", title: "Line Supervisor" }, { name: "Efe Omoruyi", title: "Night Supervisor" }, { name: "Jide Coker", title: "QA Supervisor" }],
      workers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Kunle Ajayi", "Hauwa Musa", "Peter Eze", "Sade Bello"],
      tasks: [{ template: 0, title: "WO-5521 Pump assembly", target: 500 }, { template: 1, title: "WO-5522 Retail cartons", target: 200 }, { template: 2, title: "Weekly batch audit", target: 6 }, { template: 0, title: "WO-5530 Valve assembly", target: 400 }, { template: 1, title: "WO-5531 Export cartons", target: 160 }, { template: 2, title: "Incoming materials audit", target: 4 }],
    },
  },
  {
    key: "healthcare",
    label: "Healthcare & Care Services",
    blurb: "Wards, clinics and care teams where quality and patient experience lead.",
    terms: t("Ward", "Ward Supervisor", "Care staff", "Care task", { workers: "Care staff" }),
    units: ["patients", "rounds", "beds", "checks"],
    templates: [
      { name: "Ward round", unit: "patients", defaultTarget: 24, requiresReview: true, requiresEvidence: false, checklist: ["Handover received", "Vitals recorded"] },
      { name: "Medication round", unit: "patients", defaultTarget: 24, requiresReview: true, requiresEvidence: false, checklist: ["Double-check completed"] },
      { name: "Bed turnaround", unit: "beds", defaultTarget: 6, requiresReview: false, requiresEvidence: false, checklist: [] },
    ],
    fields: [
      { label: "Patient satisfaction rating", type: "rating", required: true },
      { label: "Patients on ward", type: "number", required: true },
      { label: "Handover completed", type: "yesno", required: true },
      { label: "Incidents", type: "longtext", required: false },
    ],
    weights: { plan_completeness: 10, output_achievement: 15, quality_pass_rate: 25, on_time_delivery: 15, completion_rate: 5, attendance_rate: 10, report_compliance: 5 },
    fieldMetric: { fieldLabel: "Patient satisfaction rating", label: "Patient satisfaction", weight: 15 },
    sample: {
      locations: ["General Ward A", "Maternity Ward", "Outpatient Clinic"],
      supervisors: [{ name: "Ada Nwosu", title: "Charge Nurse" }, { name: "Yusuf Bello", title: "Ward Supervisor" }, { name: "Funke Adeoye", title: "Clinic Supervisor" }, { name: "Ruth Ibekwe", title: "Night Charge Nurse" }],
      workers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Kunle Ajayi", "Hauwa Musa", "Peter Eze", "Sade Bello"],
      tasks: [{ template: 0, title: "Morning ward round", target: 24 }, { template: 1, title: "Midday medication round", target: 24 }, { template: 2, title: "Discharge bed turnaround", target: 6 }, { template: 0, title: "Evening ward round", target: 22 }, { template: 1, title: "Evening medication round", target: 22 }, { template: 2, title: "Isolation bay turnaround", target: 3 }],
    },
  },
  {
    key: "facilities",
    label: "Facilities, Cleaning & Security",
    blurb: "Properties and client sites served by rota-based crews and patrols.",
    terms: t("Property", "Team Supervisor", "Team member", "Job", { locations: "Properties" }),
    units: ["rooms", "areas", "sq m", "patrols", "inspections"],
    templates: [
      { name: "Deep clean", unit: "rooms", defaultTarget: 20, requiresReview: true, requiresEvidence: true, checklist: ["Supplies checked", "Wet-floor signs placed"] },
      { name: "Security patrol", unit: "patrols", defaultTarget: 8, requiresReview: false, requiresEvidence: false, checklist: ["Radio check"] },
      { name: "Equipment inspection", unit: "inspections", defaultTarget: 12, requiresReview: true, requiresEvidence: true, checklist: [] },
    ],
    fields: [
      { label: "Service quality rating", type: "rating", required: true },
      { label: "Client sign-off obtained", type: "yesno", required: false },
      { label: "Issues reported to client", type: "longtext", required: false },
      { label: "Photos", type: "photo", required: false },
    ],
    weights: { plan_completeness: 10, output_achievement: 20, quality_pass_rate: 15, on_time_delivery: 20, completion_rate: 0, attendance_rate: 10, report_compliance: 10 },
    fieldMetric: { fieldLabel: "Service quality rating", label: "Client service quality", weight: 15 },
    sample: {
      locations: ["Marina Towers", "Greenfield Mall", "Skyline Apartments"],
      supervisors: [{ name: "Ahmed Sule", title: "Cleaning Supervisor" }, { name: "Joy Etim", title: "Security Supervisor" }, { name: "Bayo Ogunleye", title: "Maintenance Supervisor" }, { name: "Linda Okon", title: "Cleaning Supervisor" }],
      workers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi", "Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu", "Kunle Ajayi", "Hauwa Musa", "Peter Eze", "Sade Bello"],
      tasks: [{ template: 0, title: "Tower lobby & lifts deep clean", target: 20 }, { template: 1, title: "Night perimeter patrol", target: 8 }, { template: 2, title: "Generator & HVAC inspection", target: 12 }, { template: 0, title: "Mall food-court deep clean", target: 16 }, { template: 1, title: "Car park patrol", target: 6 }, { template: 2, title: "Fire equipment inspection", target: 10 }],
    },
  },
  {
    key: "custom",
    label: "Something else",
    blurb: "Start from a neutral setup and shape every label, form and KPI yourself.",
    terms: t("Location", "Supervisor", "Team member", "Task"),
    units: ["units", "items", "hours", "visits", "sq m"],
    templates: [
      { name: "General task", unit: "units", defaultTarget: 100, requiresReview: true, requiresEvidence: false, checklist: [] },
    ],
    fields: [
      { label: "Notes for the day", type: "longtext", required: false },
      { label: "Photos", type: "photo", required: false },
    ],
    weights: { plan_completeness: 15, output_achievement: 25, quality_pass_rate: 20, on_time_delivery: 20, completion_rate: 0, attendance_rate: 10, report_compliance: 10 },
    sample: {
      locations: ["Main Location", "Second Location"],
      supervisors: [{ name: "Alex Morgan", title: "Supervisor" }, { name: "Sam Taylor", title: "Supervisor" }, { name: "Jordan Lee", title: "Supervisor" }],
      workers: ["Casey Brown", "Riley Smith", "Jamie Cole", "Taylor Reed", "Morgan Fox", "Quinn Hall", "Avery Stone", "Drew Park", "Sky Ellis"],
      tasks: [{ template: 0, title: "Weekly deliverable A", target: 100 }, { template: 0, title: "Weekly deliverable B", target: 80 }, { template: 0, title: "Backlog clean-up", target: 60 }, { template: 0, title: "Quarterly prep", target: 120 }],
    },
  },
];

export const getPreset = (key: IndustryKey): IndustryPreset =>
  INDUSTRY_PRESETS.find((p) => p.key === key) ?? INDUSTRY_PRESETS[INDUSTRY_PRESETS.length - 1];

export const DEFAULT_PERMISSIONS = {
  createTasks: false,
  reassignTasks: false,
  manageTeam: true,
  reviewOwnTasks: false,
};

/** Build the KPI scorecard, report form and task types for an industry. */
export function buildIndustryConfig(
  key: IndustryKey,
  currency = "NGN",
): { config: WorkspaceConfig; templates: TaskTemplate[] } {
  const p = getPreset(key);
  const fields: ReportField[] = p.fields.map((f) => ({ ...f, id: uid("fld") }));
  const kpi: KpiMetricConfig[] = (Object.keys(SYSTEM_METRICS) as SystemMetricKey[]).map((k) => ({
    id: `sys_${k}`,
    label: SYSTEM_METRICS[k].label,
    description: SYSTEM_METRICS[k].description,
    weight: p.weights[k],
    enabled: p.weights[k] > 0,
    source: "system",
    systemKey: k,
  }));
  if (p.fieldMetric) {
    const f = fields.find((x) => x.label === p.fieldMetric!.fieldLabel);
    if (f) {
      kpi.push({
        id: uid("kpi"),
        label: p.fieldMetric.label,
        description: `Taken from the “${f.label}” question on the daily report.`,
        weight: p.fieldMetric.weight,
        enabled: true,
        source: "report_field",
        fieldId: f.id,
      });
    }
  }
  return {
    templates: p.templates.map((tpl) => ({ ...tpl, id: uid("tpl") })),
    config: {
      industry: key,
      terms: p.terms,
      currency: { code: currency },
      units: p.units,
      report: {
        includeAttendance: true,
        requiredDays: key === "retail" || key === "healthcare" || key === "facilities" ? EVERY_DAY : key === "construction" ? WEEKDAYS_MON_SAT : WEEKDAYS_MON_FRI,
        cutoffHour: 20,
        fields,
      },
      kpi,
      pay: {
        bonusMode: "proportional",
        minScoreForBonus: 50,
        tiers: [
          { minScore: 90, payoutPercent: 100 },
          { minScore: 75, payoutPercent: 75 },
          { minScore: 60, payoutPercent: 50 },
        ],
      },
      permissions: { ...DEFAULT_PERMISSIONS },
    },
  };
}

// ─── Sample data ────────────────────────────────────────────────────────────

const at = (dayOffset: number, hour: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const dateOnly = (dayOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return ymd(d);
};

const sampleAnswer = (f: ReportField, i: number): ReportAnswer | undefined => {
  switch (f.type) {
    case "rating": return [5, 4, 4, 3, 5][i % 5];
    case "yesno": return i % 6 !== 5;
    case "number": return 2 + ((i * 3) % 7);
    case "select": return f.options?.[0];
    case "longtext": return i % 3 === 0 ? "Minor delay in the morning; resolved by midday." : undefined;
    default: return undefined;
  }
};

/** A believable week of activity so every screen has something to show. */
export function buildSampleData(
  key: IndustryKey,
  config: WorkspaceConfig,
  templates: TaskTemplate[],
): Pick<WorkspaceData, "locations" | "supervisors" | "workers" | "tasks" | "reports"> {
  const p = getPreset(key);
  const locations: WorkLocation[] = p.sample.locations.map((name, i) => ({
    id: uid("loc"), name, code: `L${String(i + 1).padStart(2, "0")}`, status: "active",
  }));

  const supervisors: Supervisor[] = p.sample.supervisors.map((s, i) => ({
    id: uid("sup"),
    name: s.name,
    title: s.title,
    phone: `+23480${String(10000000 + i * 1234567).slice(0, 8)}`,
    email: `${s.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
    employeeCode: `SUP-${String(i + 1).padStart(3, "0")}`,
    locationIds: [locations[i % locations.length].id],
    fixedPay: 90000 + i * 5000,
    maxBonus: 40000 + i * 5000,
    status: i === 3 ? "invited" : "active",
    invitedAt: at(-30, 9),
    activatedAt: i === 3 ? undefined : at(-28, 9),
    createdAt: at(-30, 9),
  }));

  const per = Math.floor(p.sample.workers.length / 3);
  const workers: Worker[] = p.sample.workers.map((name, i) => {
    const sup = supervisors[Math.min(Math.floor(i / per), 2)];
    return { id: uid("wrk"), name, supervisorId: sup.id, locationId: sup.locationIds[0], status: "active" };
  });
  const teamOf = (supId: string) => workers.filter((w) => w.supervisorId === supId).map((w) => w.id);

  let n = 0;
  const mk = (
    supIdx: number,
    seed: IndustryPreset["sample"]["tasks"][number],
    o: {
      status: OperationalTask["status"];
      submitted: number; // share of target
      startDay: number;
      dueDay: number;
      reviewed?: number; // share of submitted that was reviewed
      approved?: number; // share of reviewed accepted
      rework?: number;
      completedDay?: number;
    },
  ): OperationalTask => {
    const tpl = templates[Math.min(seed.template, templates.length - 1)];
    const sup = supervisors[supIdx];
    const submitted = Math.round(seed.target * o.submitted);
    const reviewed = o.reviewed ? Math.round(submitted * o.reviewed) : 0;
    const steps = submitted > 0 ? [0.4, 0.75, 1] : [];
    let prev = 0;
    const progress: TaskProgressEntry[] = steps.map((s, idx) => {
      const cumulative = Math.round(submitted * s);
      const entry: TaskProgressEntry = {
        id: uid("prg"), increment: cumulative - prev, cumulative,
        createdAt: at(o.startDay + idx, 11 + idx), recordedBy: sup.name, source: "mobile",
        note: idx === 0 ? "Work started; team on site." : "Progress update.",
        evidence: tpl?.requiresEvidence ? ["photo-1.jpg"] : [],
      };
      prev = cumulative;
      return entry;
    });
    n += 1;
    const checklist: ChecklistItem[] = (tpl?.checklist ?? []).map((label) => ({
      id: uid("chk"), label, done: o.status !== "assigned",
    }));
    return {
      id: uid("tsk"), code: `TSK-${String(1000 + n)}`, title: seed.title,
      description: `${seed.title} — ${seed.target} ${tpl?.unit ?? "units"}.`,
      templateId: tpl?.id, locationId: sup.locationIds[0], supervisorId: sup.id, workerIds: teamOf(sup.id).slice(0, 3),
      unit: tpl?.unit ?? "units", targetQuantity: seed.target,
      submittedOutput: submitted, reviewedOutput: reviewed, approvedOutput: Math.round(reviewed * (o.approved ?? 1)),
      status: o.status, priority: "normal", requiresReview: tpl?.requiresReview ?? true, requiresEvidence: tpl?.requiresEvidence ?? false,
      startsAt: at(o.startDay, 8), dueAt: at(o.dueDay, 17), checklist, progress, reworkCount: o.rework ?? 0,
      completedAt: o.completedDay !== undefined ? at(o.completedDay, 15) : undefined,
      createdAt: at(o.startDay - 1, 9), createdBy: "Admin",
    };
  };

  const s = p.sample.tasks;
  const tasks: OperationalTask[] = [
    mk(0, s[0], { status: "in_progress", submitted: 0.7, startDay: -2, dueDay: 1 }),
    mk(0, s[1 % s.length], { status: "under_review", submitted: 1, startDay: -3, dueDay: 0 }),
    mk(1, s[2 % s.length], { status: "in_progress", submitted: 0.5, startDay: -4, dueDay: -1 }), // overdue
    mk(1, s[3 % s.length], { status: "assigned", submitted: 0, startDay: 1, dueDay: 3 }),
    mk(2, s[4 % s.length], { status: "completed", submitted: 1, reviewed: 1, approved: 0.94, startDay: -6, dueDay: -2, completedDay: -3 }),
    mk(2, s[5 % s.length], { status: "rework", submitted: 0.8, reviewed: 1, approved: 0.7, rework: 1, startDay: -3, dueDay: 1 }),
  ];

  const reports: DailyReport[] = [];
  const plan: [number, number[]][] = [[0, [0, -1, -2, -3, -4]], [1, [-1, -2, -4]], [2, [0, -1]]];
  for (const [supIdx, days] of plan) {
    const sup = supervisors[supIdx];
    days.forEach((off, i) => {
      const late = supIdx === 1 && off === -2;
      const answers: Record<string, ReportAnswer> = {};
      config.report.fields.forEach((f, fi) => {
        const a = sampleAnswer(f, i + fi + supIdx);
        if (a !== undefined) answers[f.id] = a;
      });
      const team = teamOf(sup.id).length;
      reports.push({
        id: uid("rpt"), supervisorId: sup.id, locationId: sup.locationIds[0], reportDate: dateOnly(off),
        workersAssigned: team, workersPresent: Math.max(0, team - (i % 3 === 1 ? 1 : 0)), answers,
        submittedAt: (() => {
          const t = at(late ? off + 1 : off, late ? 8 : 17);
          return new Date(t) > new Date() ? new Date().toISOString() : t;
        })(),
        source: "mobile",
        reviewStatus: off === 0 ? "submitted" : "approved", reviewedAt: off === 0 ? undefined : at(off + 1, 9),
      });
    });
  }
  return { locations, supervisors, workers, tasks, reports };
}

export function emptyWorkspace(): WorkspaceData {
  const { config, templates } = buildIndustryConfig("custom");
  return {
    setupDone: false, config, templates, locations: [], supervisors: [], workers: [],
    tasks: [], reports: [], manualScores: [], payroll: [],
  };
}

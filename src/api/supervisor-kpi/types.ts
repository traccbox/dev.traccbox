/**
 * Industry-agnostic domain model for Workforce & Supervisor operations.
 *
 * Nothing here is specific to one business: wording, units, the daily report
 * form, the KPI scorecard and the pay rules are all workspace configuration.
 * The same shapes are what the backend API and the mobile app exchange.
 */

// ─── Workspace configuration ────────────────────────────────────────────────

export type IndustryKey =
  | "construction"
  | "logistics"
  | "retail"
  | "manufacturing"
  | "healthcare"
  | "facilities"
  | "custom";

/** What this business calls things. Drives every label in the dashboard + mobile app. */
export interface Terminology {
  location: string;
  locations: string;
  supervisor: string;
  supervisors: string;
  worker: string;
  workers: string;
  task: string;
  tasks: string;
}

export interface CurrencyConfig {
  code: string; // ISO 4217, e.g. NGN
}

export type ReportFieldType =
  | "number"
  | "text"
  | "longtext"
  | "yesno"
  | "rating" // 1–5
  | "select"
  | "photo";

export interface ReportField {
  id: string;
  label: string;
  type: ReportFieldType;
  required: boolean;
  options?: string[]; // for "select"
  help?: string;
}

export interface ReportTemplate {
  /** Ask for workers assigned / present (feeds the attendance KPI). */
  includeAttendance: boolean;
  /** Reports must be filed on these days (0 = Sunday … 6 = Saturday). */
  requiredDays: number[];
  /** Hour of the day (0–23) after which a report for that day counts as late. */
  cutoffHour: number;
  fields: ReportField[];
}

export type SystemMetricKey =
  | "plan_completeness"
  | "output_achievement"
  | "quality_pass_rate"
  | "on_time_delivery"
  | "completion_rate"
  | "attendance_rate"
  | "report_compliance";

export type KpiMetricSource = "system" | "report_field" | "manual";

export interface KpiMetricConfig {
  id: string;
  label: string;
  description: string;
  weight: number; // 0–100, enabled weights should total 100
  enabled: boolean;
  source: KpiMetricSource;
  systemKey?: SystemMetricKey; // source === "system"
  fieldId?: string; // source === "report_field" (rating or yes/no field)
}

export type BonusMode = "none" | "proportional" | "tiered";

export interface PayTier {
  minScore: number; // KPI score at or above which this tier applies
  payoutPercent: number; // % of the maximum bonus paid
}

export interface PayRules {
  bonusMode: BonusMode;
  /** KPI score below which no bonus is paid (proportional + tiered). */
  minScoreForBonus: number;
  tiers: PayTier[];
}

/** What a supervisor may do in the mobile app. */
export interface SupervisorPermissions {
  createTasks: boolean;
  reassignTasks: boolean;
  manageTeam: boolean;
  reviewOwnTasks: boolean;
}

export interface TaskTemplate {
  id: string;
  name: string;
  unit: string;
  defaultTarget?: number;
  requiresReview: boolean;
  requiresEvidence: boolean;
  checklist: string[];
}

export interface WorkspaceConfig {
  industry: IndustryKey;
  terms: Terminology;
  currency: CurrencyConfig;
  units: string[];
  report: ReportTemplate;
  kpi: KpiMetricConfig[];
  pay: PayRules;
  permissions: SupervisorPermissions;
}

// ─── Core records ───────────────────────────────────────────────────────────

export interface WorkLocation {
  id: string;
  name: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number; // metres
  status: "active" | "archived";
}

export type SupervisorStatus = "invited" | "active" | "suspended";

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  employeeCode?: string;
  title?: string;
  locationIds: string[];
  fixedPay: number;
  maxBonus: number;
  status: SupervisorStatus;
  invitedAt?: string;
  activatedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  supervisorId: string;
  locationId?: string;
  status: "active" | "inactive";
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "under_review"
  | "rework"
  | "completed"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface TaskProgressEntry {
  id: string;
  increment: number;
  cumulative: number;
  createdAt: string;
  recordedBy: string;
  source: "mobile" | "dashboard";
  note: string;
  evidence: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface OperationalTask {
  id: string;
  code: string;
  title: string;
  description: string;
  templateId?: string;
  locationId: string;
  supervisorId: string;
  workerIds: string[];
  unit: string;
  targetQuantity: number;
  /** Cumulative output reported by the supervisor. */
  submittedOutput: number;
  /** Output covered by the latest review. */
  reviewedOutput: number;
  /** Output accepted by the reviewer. */
  approvedOutput: number;
  status: TaskStatus;
  priority: TaskPriority;
  requiresReview: boolean;
  requiresEvidence: boolean;
  startsAt: string;
  dueAt: string;
  checklist: ChecklistItem[];
  progress: TaskProgressEntry[];
  reworkCount: number;
  reviewNote?: string;
  completedAt?: string;
  createdAt: string;
  createdBy: string;
}

// ─── Daily reports ──────────────────────────────────────────────────────────

export type ReportReviewStatus = "submitted" | "approved" | "returned";
export type ReportAnswer = string | number | boolean;

export interface DailyReport {
  id: string;
  supervisorId: string;
  locationId: string;
  reportDate: string; // YYYY-MM-DD
  workersAssigned: number;
  workersPresent: number;
  answers: Record<string, ReportAnswer>;
  submittedAt: string;
  source: "mobile" | "dashboard";
  reviewStatus: ReportReviewStatus;
  reviewNote?: string;
  reviewedAt?: string;
}

// ─── KPI ────────────────────────────────────────────────────────────────────

export interface ManualScore {
  id: string;
  supervisorId: string;
  metricId: string;
  period: string; // YYYY-MM
  score: number; // 0–100
  note?: string;
  recordedAt: string;
}

export interface KpiComponent {
  metricId: string;
  label: string;
  source: KpiMetricSource;
  weight: number;
  achievement: number | null;
  evidenceCount: number;
  detail: string;
  weightedScore: number | null;
}

export interface SupervisorKpiResult {
  score: number | null;
  components: KpiComponent[];
  eligibleWeight: number;
}

// ─── Payroll ────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "approved" | "paid";

export interface PayItem {
  id: string;
  label: string;
  amount: number;
}

export interface SupervisorPayrollRecord {
  id: string;
  supervisorId: string;
  period: string; // YYYY-MM
  fixedPay: number;
  maxBonus: number;
  kpiScore: number | null; // snapshot, refreshed until approved
  bonus: number;
  allowances: PayItem[];
  deductions: PayItem[];
  status: PaymentStatus;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  paymentReference?: string;
}

// ─── Persisted workspace ────────────────────────────────────────────────────

export interface WorkspaceData {
  setupDone: boolean;
  config: WorkspaceConfig;
  locations: WorkLocation[];
  supervisors: Supervisor[];
  workers: Worker[];
  templates: TaskTemplate[];
  tasks: OperationalTask[];
  reports: DailyReport[];
  manualScores: ManualScore[];
  payroll: SupervisorPayrollRecord[];
}

export type OperationalTaskStatus =
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "submitted"
  | "under_inspection"
  | "approved"
  | "rework"
  | "completed";

export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type ReportReviewStatus = "submitted" | "approved" | "returned";
export type SupervisorPaymentStatus = "pending" | "approved" | "paid";

export interface TaskProgressEntry {
  id: string;
  increment: number;
  cumulative: number;
  createdAt: string;
  recordedBy: string;
  note: string;
  evidence: string[];
}

export interface OperationalTask {
  id: string;
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  supervisorId: string;
  assignedWorkers: string[];
  targetQuantity: number;
  unit: string;
  submittedOutput: number;
  verifiedOutput: number;
  inspectedOutput: number;
  approvedOutput: number;
  status: OperationalTaskStatus;
  priority: TaskPriority;
  startsAt: string;
  dueAt: string;
  planningComplete: boolean;
  materials: string[];
  progress: TaskProgressEntry[];
  inspectionNote?: string;
  approvedAt?: string;
}

export interface DailyProgressReport {
  id: string;
  supervisorId: string;
  supervisorName: string;
  siteId: string;
  siteName: string;
  reportDate: string;
  workersAssigned: number;
  workersPresent: number;
  workersAbsent: number;
  tasksAssigned: number;
  tasksInProgress: number;
  tasksSubmitted: number;
  tasksCompleted: number;
  targetOutput: number;
  actualOutput: number;
  delayNotes: string;
  materialsAndEquipment: string;
  qualityAndSafetyNotes: string;
  supervisorComments: string;
  attendanceCompleteness: number;
  allocationAccuracy: number;
  issueResolution: number;
  submittedAt: string;
  reviewStatus: ReportReviewStatus;
  reviewNote?: string;
}

export interface SupervisorProfile {
  id: string;
  name: string;
  role: string;
  siteId: string;
  siteName: string;
  department: string;
}

export interface KpiComponent {
  key: "planning" | "productivity" | "quality" | "delivery" | "workforce";
  label: string;
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

export interface SupervisorPayrollRecord {
  id: string;
  supervisorId: string;
  period: string;
  fixedPay: number;
  maximumBonus: number;
  kpiScore: number;
  deductions: number;
  status: SupervisorPaymentStatus;
  paidAt?: string;
  paymentReference?: string;
}
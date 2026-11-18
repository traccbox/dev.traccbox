import type {
  DailyProgressReport,
  OperationalTask,
  SupervisorPayrollRecord,
  SupervisorProfile,
} from "./types";

const baseDay = new Date();
baseDay.setHours(8, 0, 0, 0);
const day = (offset: number, hour = 8) => {
  const value = new Date(baseDay);
  value.setDate(value.getDate() + offset);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
const dateOnly = (offset: number) => day(offset).slice(0, 10);

export const SAMPLE_SUPERVISORS: SupervisorProfile[] = [
  { id: "sup-1", name: "Adaeze Okafor", role: "Site Supervisor", siteId: "site-1", siteName: "Ikeja Housing Project", department: "Construction" },
  { id: "sup-2", name: "Tunde Balogun", role: "Site Supervisor", siteId: "site-2", siteName: "Lekki Distribution Hub", department: "Logistics" },
  { id: "sup-3", name: "Musa Ibrahim", role: "Site Supervisor", siteId: "site-3", siteName: "Victoria Island Office Fit-out", department: "Facilities" },
];

export const SAMPLE_WORKERS = [
  "Chidi Okonkwo", "Amaka Eze", "Tunde Bakare", "Fatima Yusuf", "Emeka Nwosu", "Blessing Adeyemi", "Samuel Ojo", "Grace Umeh", "Ibrahim Danladi", "Ngozi Obi",
];

export const INITIAL_TASKS: OperationalTask[] = [
  {
    id: "OPS-2401", title: "Block laying — west wing", description: "Complete and record the west wing blockwork through level two.", siteId: "site-1", siteName: "Ikeja Housing Project", supervisorId: "sup-1", assignedWorkers: ["Chidi Okonkwo", "Amaka Eze", "Emeka Nwosu"], targetQuantity: 1000, unit: "blocks", submittedOutput: 750, verifiedOutput: 700, inspectedOutput: 500, approvedOutput: 475, status: "in_progress", priority: "high", startsAt: day(-1), dueAt: day(1, 17), planningComplete: true, materials: ["Cement", "Blocks", "Sand"], progress: [
      { id: "pr-1", increment: 200, cumulative: 200, createdAt: day(0, 10), recordedBy: "Adaeze Okafor", note: "Morning progress verified on site.", evidence: ["2 site photos"] },
      { id: "pr-2", increment: 300, cumulative: 500, createdAt: day(0, 13), recordedBy: "Adaeze Okafor", note: "Team output; not duplicated across workers.", evidence: ["1 site photo"] },
      { id: "pr-3", increment: 250, cumulative: 750, createdAt: day(0, 16), recordedBy: "Adaeze Okafor", note: "End-of-day update; 50 blocks pending verification.", evidence: [] },
    ],
  },
  {
    id: "OPS-2402", title: "Floor screeding — block A", description: "Screed the ground-floor corridor and rooms.", siteId: "site-1", siteName: "Ikeja Housing Project", supervisorId: "sup-1", assignedWorkers: ["Tunde Bakare", "Fatima Yusuf"], targetQuantity: 250, unit: "sq m", submittedOutput: 250, verifiedOutput: 250, inspectedOutput: 250, approvedOutput: 225, status: "under_inspection", priority: "normal", startsAt: day(-2), dueAt: day(0, 15), planningComplete: true, materials: ["Cement", "Fine sand"], progress: [{ id: "pr-4", increment: 250, cumulative: 250, createdAt: day(0, 14), recordedBy: "Adaeze Okafor", note: "Submitted with completion photos.", evidence: ["3 site photos"] }],
  },
  {
    id: "OPS-2403", title: "Outbound order dispatch", description: "Pick, check and dispatch the scheduled wholesale orders.", siteId: "site-2", siteName: "Lekki Distribution Hub", supervisorId: "sup-2", assignedWorkers: ["Blessing Adeyemi", "Samuel Ojo", "Grace Umeh"], targetQuantity: 20, unit: "trips", submittedOutput: 14, verifiedOutput: 12, inspectedOutput: 10, approvedOutput: 10, status: "in_progress", priority: "urgent", startsAt: day(0), dueAt: day(0, 18), planningComplete: true, materials: ["Dispatch manifests", "Safety vests"], progress: [{ id: "pr-5", increment: 14, cumulative: 14, createdAt: day(0, 12), recordedBy: "Tunde Balogun", note: "Two trips awaiting manifest verification.", evidence: ["Manifest scan"] }],
  },
  {
    id: "OPS-2404", title: "Install safety barriers", description: "Install temporary barriers around the loading bay.", siteId: "site-2", siteName: "Lekki Distribution Hub", supervisorId: "sup-2", assignedWorkers: ["Ibrahim Danladi", "Ngozi Obi"], targetQuantity: 1, unit: "site", submittedOutput: 0, verifiedOutput: 0, inspectedOutput: 0, approvedOutput: 0, status: "assigned", priority: "high", startsAt: day(1), dueAt: day(2, 17), planningComplete: false, materials: ["Safety barriers", "Reflective tape"], progress: [],
  },
  {
    id: "OPS-2405", title: "Office partition touch-ups", description: "Close the final inspection items for the third-floor partitions.", siteId: "site-3", siteName: "Victoria Island Office Fit-out", supervisorId: "sup-3", assignedWorkers: ["Amaka Eze", "Emeka Nwosu"], targetQuantity: 100, unit: "sq m", submittedOutput: 100, verifiedOutput: 100, inspectedOutput: 100, approvedOutput: 90, status: "completed", priority: "normal", startsAt: day(-4), dueAt: day(-1, 17), planningComplete: true, materials: ["Joint compound", "Primer"], progress: [{ id: "pr-6", increment: 100, cumulative: 100, createdAt: day(-1, 14), recordedBy: "Musa Ibrahim", note: "Final output submitted for site inspection.", evidence: ["2 site photos"] }], approvedAt: day(-1, 16),
  },
];

export const INITIAL_DAILY_REPORTS: DailyProgressReport[] = [
  { id: "DR-1101", supervisorId: "sup-1", supervisorName: "Adaeze Okafor", siteId: "site-1", siteName: "Ikeja Housing Project", reportDate: dateOnly(0), workersAssigned: 5, workersPresent: 4, workersAbsent: 1, tasksAssigned: 2, tasksInProgress: 1, tasksSubmitted: 1, tasksCompleted: 0, targetOutput: 1250, actualOutput: 1000, delayNotes: "One worker absent; block delivery arrived late.", materialsAndEquipment: "Fine sand delivery moved to tomorrow.", qualityAndSafetyNotes: "One corridor section returned for minor leveling.", supervisorComments: "Team maintained safe access around the loading area.", attendanceCompleteness: 100, allocationAccuracy: 90, issueResolution: 80, submittedAt: day(0, 17), reviewStatus: "submitted" },
  { id: "DR-1102", supervisorId: "sup-2", supervisorName: "Tunde Balogun", siteId: "site-2", siteName: "Lekki Distribution Hub", reportDate: dateOnly(-1), workersAssigned: 5, workersPresent: 5, workersAbsent: 0, tasksAssigned: 2, tasksInProgress: 1, tasksSubmitted: 1, tasksCompleted: 1, targetOutput: 21, actualOutput: 18, delayNotes: "Two dispatches held for an incomplete manifest.", materialsAndEquipment: "All equipment available.", qualityAndSafetyNotes: "No quality or safety incidents.", supervisorComments: "Held dispatch until route documentation was complete.", attendanceCompleteness: 100, allocationAccuracy: 100, issueResolution: 90, submittedAt: day(-1, 17), reviewStatus: "approved", reviewNote: "Reviewed by site manager." },
  { id: "DR-1103", supervisorId: "sup-3", supervisorName: "Musa Ibrahim", siteId: "site-3", siteName: "Victoria Island Office Fit-out", reportDate: dateOnly(-1), workersAssigned: 2, workersPresent: 2, workersAbsent: 0, tasksAssigned: 1, tasksInProgress: 0, tasksSubmitted: 0, tasksCompleted: 1, targetOutput: 100, actualOutput: 100, delayNotes: "", materialsAndEquipment: "", qualityAndSafetyNotes: "Final inspection passed with minor touch-ups recorded.", supervisorComments: "Task closed after manager inspection.", attendanceCompleteness: 100, allocationAccuracy: 100, issueResolution: 100, submittedAt: day(-1, 16), reviewStatus: "approved", reviewNote: "Accepted." },
];

export const INITIAL_SUPERVISOR_PAYROLL: SupervisorPayrollRecord[] = [
  { id: "SP-2026-11-01", supervisorId: "sup-1", period: "2026-11", fixedPay: 100000, maximumBonus: 50000, kpiScore: 88, deductions: 0, status: "approved" },
  { id: "SP-2026-11-02", supervisorId: "sup-2", period: "2026-11", fixedPay: 90000, maximumBonus: 40000, kpiScore: 84, deductions: 2500, status: "pending" },
  { id: "SP-2026-11-03", supervisorId: "sup-3", period: "2026-11", fixedPay: 95000, maximumBonus: 45000, kpiScore: 91, deductions: 0, status: "paid", paidAt: day(-2), paymentReference: "SAMPLE-TRF-1103" },
];

export const SAMPLE_SITES = [
  { id: "site-1", name: "Ikeja Housing Project" },
  { id: "site-2", name: "Lekki Distribution Hub" },
  { id: "site-3", name: "Victoria Island Office Fit-out" },
];
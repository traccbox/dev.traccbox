import { delay } from "./orgData";

export interface CurrentPlan {
  plan: string;
  status: "Active" | "Trial" | "Expired";
  billingCycle: "Monthly" | "Yearly";
  nextRenewal: string;
  companyName: string;
  employeeLimit: number;
  employeesUsed: number;
  branchLimit: number;
  branchesUsed: number;
  storageLimitGB: number;
  storageUsedGB: number;
  amount: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  plan: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  status: "Paid" | "Pending" | "Failed";
}

export interface PlanTier {
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  employees: string;
  storage: string;
  support: string;
  features: string[];
  cta: string;
}

export interface TrialConfig {
  enableTrial: boolean;
  trialDurationDays: number;
  maxEmployees: number;
  maxBranches: number;
  maxTeams: number;
  maxDailyCheckIns: number;
  enableGPS: boolean;
  enableReports: boolean;
  enableGeofencing: boolean;
  enableRouteTracking: boolean;
  autoExpireTrial: boolean;
  sendReminderBeforeExpiry: boolean;
  reminderDaysBefore: number;
  autoDisableCompany: boolean;
  convertTrialToPaid: boolean;
}

export async function fetchCurrentPlan() {
  const plan: CurrentPlan = {
    plan: "Growth",
    status: "Active",
    billingCycle: "Monthly",
    nextRenewal: "2026-09-01",
    companyName: "TraccBox Demo Ltd",
    employeeLimit: 50,
    employeesUsed: 32,
    branchLimit: 8,
    branchesUsed: 4,
    storageLimitGB: 50,
    storageUsedGB: 18.4,
    amount: "₦120,000",
  };
  return delay(plan);
}

export async function fetchInvoices() {
  const invoices: Invoice[] = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      id: `inv-${i + 1}`,
      invoiceNumber: `TRB-${2026 - Math.floor(i / 12)}-${String(1043 - i).padStart(4, "0")}`,
      plan: i % 5 === 0 ? "Business" : "Growth",
      amount: i % 5 === 0 ? "₦280,000" : "₦120,000",
      paymentMethod: i % 3 === 0 ? "Bank Transfer" : "Visa •••• 4242",
      paymentDate: d.toISOString().slice(0, 10),
      status: i === 1 ? "Pending" : i === 7 ? "Failed" : "Paid",
    };
  });
  return delay(invoices);
}

export const PLAN_TIERS: PlanTier[] = [
  {
    name: "Starter",
    price: "₦35,000",
    cadence: "/month",
    employees: "Up to 10 employees",
    storage: "5 GB storage",
    support: "Email support",
    features: ["GPS check-in / check-out", "Basic performance logs", "1 branch", "Mobile app access"],
    cta: "Downgrade",
  },
  {
    name: "Growth",
    price: "₦120,000",
    cadence: "/month",
    highlight: true,
    employees: "Up to 50 employees",
    storage: "50 GB storage",
    support: "Priority email & chat",
    features: [
      "Everything in Starter",
      "Weekly & monthly reports",
      "Geofencing & work areas",
      "Travel distance monitoring",
      "Up to 8 branches",
    ],
    cta: "Current Plan",
  },
  {
    name: "Business",
    price: "₦280,000",
    cadence: "/month",
    employees: "Up to 200 employees",
    storage: "250 GB storage",
    support: "Dedicated success manager",
    features: [
      "Everything in Growth",
      "Call history & communication logs",
      "Advanced analytics & exports",
      "Unlimited branches",
      "API access",
    ],
    cta: "Upgrade",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    employees: "Unlimited employees",
    storage: "Unlimited storage",
    support: "24/7 premium support & SLA",
    features: [
      "Everything in Business",
      "Single sign-on (SSO)",
      "Custom integrations",
      "On-premise data residency",
      "Custom onboarding & training",
    ],
    cta: "Contact Sales",
  },
];

export async function fetchTrialConfig() {
  const cfg: TrialConfig = {
    enableTrial: true,
    trialDurationDays: 14,
    maxEmployees: 10,
    maxBranches: 2,
    maxTeams: 3,
    maxDailyCheckIns: 50,
    enableGPS: true,
    enableReports: true,
    enableGeofencing: false,
    enableRouteTracking: false,
    autoExpireTrial: true,
    sendReminderBeforeExpiry: true,
    reminderDaysBefore: 3,
    autoDisableCompany: true,
    convertTrialToPaid: false,
  };
  return delay(cfg);
}

export async function saveTrialConfig(cfg: TrialConfig) {
  return delay({ success: true, config: cfg }, 600);
}

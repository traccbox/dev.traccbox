import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import type { PaymentStatus, ReportReviewStatus, SupervisorStatus, TaskPriority, TaskStatus } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";

export const BASE = "/dashboard/workforce-supervisor";

export const inputCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400";
export const areaCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100";
export const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1658E5] px-4 text-sm font-medium text-white hover:bg-[#1249bd] disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

export const Panel: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, actions, className = "", bodyClassName = "p-4", children }) => (
  <section className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  to?: string;
}> = ({ label, value, hint, tone = "default", to }) => {
  const color = { default: "text-gray-900", good: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" }[tone];
  const body = (
    <div className="h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const TONES = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-violet-50 text-violet-700",
} as const;

export const Pill: React.FC<{ tone?: keyof typeof TONES; children: React.ReactNode }> = ({ tone = "gray", children }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
    {children}
  </span>
);

export const TASK_STATUS: Record<TaskStatus, { label: string; tone: keyof typeof TONES }> = {
  assigned: { label: "Assigned", tone: "gray" },
  in_progress: { label: "In progress", tone: "blue" },
  on_hold: { label: "On hold", tone: "amber" },
  under_review: { label: "Under review", tone: "purple" },
  rework: { label: "Rework", tone: "red" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "gray" },
};
export const TaskStatusPill = ({ status }: { status: TaskStatus }) => (
  <Pill tone={TASK_STATUS[status].tone}>{TASK_STATUS[status].label}</Pill>
);

export const PRIORITY_TONE: Record<TaskPriority, keyof typeof TONES> = { low: "gray", normal: "blue", high: "amber", urgent: "red" };
export const PriorityPill = ({ priority }: { priority: TaskPriority }) => (
  <Pill tone={PRIORITY_TONE[priority]}>{priority[0].toUpperCase() + priority.slice(1)}</Pill>
);

const SUP_TONE: Record<SupervisorStatus, keyof typeof TONES> = { active: "green", invited: "amber", suspended: "red" };
export const SupervisorStatusPill = ({ status }: { status: SupervisorStatus }) => (
  <Pill tone={SUP_TONE[status]}>{status === "invited" ? "Invite pending" : status[0].toUpperCase() + status.slice(1)}</Pill>
);

const REVIEW_TONE: Record<ReportReviewStatus, keyof typeof TONES> = { submitted: "amber", approved: "green", returned: "red" };
export const ReviewPill = ({ status }: { status: ReportReviewStatus }) => (
  <Pill tone={REVIEW_TONE[status]}>{status === "submitted" ? "Awaiting review" : status[0].toUpperCase() + status.slice(1)}</Pill>
);

const PAY_TONE: Record<PaymentStatus, keyof typeof TONES> = { pending: "amber", approved: "blue", paid: "green" };
export const PayPill = ({ status }: { status: PaymentStatus }) => (
  <Pill tone={PAY_TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Pill>
);

export const ProgressBar: React.FC<{ value: number; tone?: "blue" | "green" | "red" | "amber" }> = ({ value, tone = "blue" }) => {
  const bg = { blue: "bg-[#1658E5]", green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};

export const scoreTone = (s: number | null): "default" | "good" | "warn" | "bad" =>
  s === null ? "default" : s >= 80 ? "good" : s >= 60 ? "warn" : "bad";

export const ScoreBadge: React.FC<{ score: number | null }> = ({ score }) => {
  const tone = scoreTone(score);
  const cls = { default: "bg-gray-100 text-gray-500", good: "bg-emerald-50 text-emerald-700", warn: "bg-amber-50 text-amber-700", bad: "bg-red-50 text-red-700" }[tone];
  return <span className={`inline-block min-w-[44px] rounded-md px-2 py-1 text-center text-xs font-semibold ${cls}`}>{score === null ? "N/A" : score.toFixed(0)}</span>;
};

export const Empty: React.FC<{
  title: string;
  message?: string;
  action?: { label: string; onClick?: () => void; to?: string };
}> = ({ title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <Inbox className="h-6 w-6" />
    </div>
    <p className="text-sm font-semibold text-gray-800">{title}</p>
    {message && <p className="mt-1 max-w-sm text-xs text-gray-500">{message}</p>}
    {action &&
      (action.to ? (
        <Link to={action.to} className={`${btnPrimary} mt-4`}>
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <button onClick={action.onClick} className={`${btnPrimary} mt-4`}>
          {action.label}
        </button>
      ))}
  </div>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, required, className = "", children }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-xs font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}
  </label>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1658E5]" />
    <span>
      <span className="block text-sm text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </span>
  </label>
);

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—";
export const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#1658E5]">{initials(name)}</span>
);

/** Money formatter bound to the workspace currency. */
export const useMoney = () => {
  const { config } = useWorkforce();
  return (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: config.currency.code, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${config.currency.code} ${Math.round(n).toLocaleString()}`;
    }
  };
};

/** Workspace vocabulary: `T.location`, `T.supervisors`, … */
export const useTerms = () => useWorkforce().config.terms;
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const lower = (s: string) => s.toLowerCase();

export const PeriodPicker: React.FC<{ value: string; onChange: (p: string) => void }> = ({ value, onChange }) => (
  <input type="month" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} className={`${inputCls} w-auto`} />
);

export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

import { EMPLOYEES, delay, rand } from "./orgData";

export type CallType = "Incoming" | "Outgoing";
export type CallStatus = "Connected" | "Missed" | "Rejected" | "Voicemail";

export interface CallRecord {
  id: string;
  employeeId: string;
  employee: string;
  employeePhoto: string;
  employeeRole: string;
  customer: string;
  customerCompany: string;
  customerEmail: string;
  phoneNumber: string;
  callType: CallType;
  durationSeconds: number;
  status: CallStatus;
  date: string; // ISO
  notes: string;
  followUpDate?: string;
  timeline: { label: string; time: string }[];
}

const CUSTOMERS = [
  ["Bola Martins", "Martins Stores"],
  ["Kelechi Ude", "Ude Distribution"],
  ["Aisha Sanni", "Sanni Supermarket"],
  ["Victor Ade", "Adex Ventures"],
  ["Rita Johnson", "RJ Pharmacy"],
  ["Musa Garba", "Garba & Sons"],
];

const STATUSES: CallStatus[] = ["Connected", "Missed", "Rejected", "Voicemail"];

const CALLS: CallRecord[] = Array.from({ length: 64 }).map((_, i) => {
  const emp = EMPLOYEES[i % EMPLOYEES.length];
  const [customer, company] = CUSTOMERS[i % CUSTOMERS.length];
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(i / 6));
  d.setHours(9 + (i % 9), (i * 11) % 60, 0, 0);
  const status = STATUSES[i % 9 === 0 ? 3 : i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0];
  return {
    id: `call-${i + 1}`,
    employeeId: emp.id,
    employee: emp.name,
    employeePhoto: emp.photo,
    employeeRole: `${emp.department} • ${emp.branch}`,
    customer,
    customerCompany: company,
    customerEmail: `${customer.split(" ")[0].toLowerCase()}@${company
      .split(" ")[0]
      .toLowerCase()}.com`,
    phoneNumber: `+234 80${rand(i, 10, 99)} ${rand(i + 1, 100, 999)} ${rand(i + 2, 1000, 9999)}`,
    callType: i % 2 === 0 ? "Outgoing" : "Incoming",
    durationSeconds: status === "Connected" ? rand(i + 3, 45, 900) : 0,
    status,
    date: d.toISOString(),
    notes:
      status === "Connected"
        ? "Discussed restock order and confirmed delivery window for next week."
        : "No answer — retry scheduled.",
    followUpDate: i % 4 === 0 ? new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10) : undefined,
    timeline: [
      { label: "Call initiated", time: d.toISOString() },
      { label: status === "Connected" ? "Call connected" : "No answer", time: d.toISOString() },
      { label: "Notes added", time: d.toISOString() },
    ],
  };
});

export interface CallFilters {
  date?: string;
  employeeId?: string;
  customer?: string;
  status?: string;
  search?: string;
}

export async function fetchCalls(filters: CallFilters = {}) {
  const rows = CALLS.filter((c) => {
    if (filters.date && !c.date.startsWith(filters.date)) return false;
    if (filters.employeeId && c.employeeId !== filters.employeeId) return false;
    if (filters.customer && c.customer !== filters.customer) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !c.customer.toLowerCase().includes(q) &&
        !c.employee.toLowerCase().includes(q) &&
        !c.phoneNumber.includes(q)
      )
        return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const connected = rows.filter((c) => c.status === "Connected");
  const summary = {
    total: rows.length,
    incoming: rows.filter((c) => c.callType === "Incoming").length,
    outgoing: rows.filter((c) => c.callType === "Outgoing").length,
    missed: rows.filter((c) => c.status === "Missed").length,
    connected: connected.length,
    averageDuration: connected.length
      ? Math.round(
          connected.reduce((s, c) => s + c.durationSeconds, 0) / connected.length,
        )
      : 0,
  };

  return delay({ rows, summary, customers: CUSTOMERS.map((c) => c[0]) });
}

export async function addCallNote(id: string, note: string) {
  return delay({ success: true, id, note }, 400);
}

export async function scheduleFollowUp(id: string, date: string) {
  return delay({ success: true, id, date }, 400);
}

export const formatDuration = (s: number) =>
  s === 0 ? "—" : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;

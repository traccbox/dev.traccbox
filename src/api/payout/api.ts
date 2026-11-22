import api from "@/api/AxiosInstance";
import type {
  CreateSiteInput,
  DailyAttendance,
  DailyPayout,
  DailyWorker,
  ListOptions,
  LocationInput,
  PageResult,
  PayoutSite,
  PayoutSlip,
  RegisterWorkerInput,
} from "./types";

const LOCAL_STORAGE_KEYS = {
  SITES: "traccbox_payout_sites_v1",
  WORKERS: "traccbox_payout_workers_v1",
  ATTENDANCE: "traccbox_payout_attendance_v1",
  PAYOUTS: "traccbox_payout_payouts_v1",
};

// Seed initial demo data for smooth offline/dev experience if backend returns 404
const INITIAL_SITES: PayoutSite[] = [
  {
    id: "site-001",
    name: "Ikeja Construction Site",
    project: "Lagos Housing Project Phase II",
    latitude: 6.6018,
    longitude: 3.3515,
    geofence_radius: 100,
    status: "active",
    address: "Mobolaji Bank Anthony Way, Ikeja, Lagos",
  },
  {
    id: "site-002",
    name: "Lekki Commercial Complex",
    project: "Ocean View Tower",
    latitude: 6.4474,
    longitude: 3.4723,
    geofence_radius: 150,
    status: "active",
    address: "Admiralty Way, Lekki Phase 1, Lagos",
  },
  {
    id: "site-003",
    name: "Abuja Tech Hub Site",
    project: "Federal Innovation Center",
    latitude: 9.0765,
    longitude: 7.3986,
    geofence_radius: 200,
    status: "active",
    address: "Central Business District, Abuja",
  },
];

const INITIAL_WORKERS: DailyWorker[] = [
  {
    id: "TB-0001",
    name: "Musa Ibrahim",
    phone: "+234 803 123 4567",
    role: "Mason",
    site_id: "site-001",
    site: INITIAL_SITES[0],
    daily_wage: 7000,
    standard_hours: 8,
    status: "active",
    registered_at: new Date().toISOString(),
  },
  {
    id: "TB-0002",
    name: "Chinedu Okeke",
    phone: "+234 802 987 6543",
    role: "Labourer",
    site_id: "site-001",
    site: INITIAL_SITES[0],
    daily_wage: 5500,
    standard_hours: 8,
    status: "active",
    registered_at: new Date().toISOString(),
  },
  {
    id: "TB-0003",
    name: "Amina Yusuf",
    phone: "+234 805 444 3322",
    role: "Carpenter",
    site_id: "site-002",
    site: INITIAL_SITES[1],
    daily_wage: 8000,
    standard_hours: 8,
    status: "active",
    registered_at: new Date().toISOString(),
  },
];

function getStored<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(data) as T[];
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to update localStorage for key", key, err);
  }
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data?.result ?? response?.data) as T;
const listResult = <T>(value: any, options: ListOptions = {}): PageResult<T> => {
  const body = value?.data ?? value?.results ?? value;
  const rows = Array.isArray(body) ? body : (body?.items ?? body?.results ?? body?.data ?? []);
  return {
    data: rows,
    total: Number(body?.total ?? body?.total_count ?? value?.total ?? rows.length),
    page: Number(body?.page ?? options.page ?? 1),
    limit: Number(body?.limit ?? body?.page_size ?? options.limit ?? rows.length),
  };
};

export async function getSites(options: ListOptions = {}): Promise<PageResult<PayoutSite>> {
  try {
    const response = await api.get("/sites", { params: options });
    const res = listResult<PayoutSite>(response.data, options);
    if (res.data.length > 0) return res;
  } catch {
    console.warn("Backend /sites unavailable, using local site store.");
  }
  let sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  if (options.search) {
    const q = options.search.toLowerCase();
    sites = sites.filter((s) => s.name.toLowerCase().includes(q) || s.project?.toLowerCase().includes(q));
  }
  return {
    data: sites,
    total: sites.length,
    page: options.page || 1,
    limit: options.limit || sites.length,
  };
}

export async function createSite(payload: CreateSiteInput): Promise<PayoutSite> {
  try {
    return unwrap<PayoutSite>(await api.post("/sites", payload));
  } catch {
    console.warn("Backend /sites POST unavailable, saving locally.");
  }
  const sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  const newSite: PayoutSite = {
    id: `site-${Date.now().toString().slice(-4)}`,
    ...payload,
    status: "active",
  };
  sites.unshift(newSite);
  setStored(LOCAL_STORAGE_KEYS.SITES, sites);
  return newSite;
}

export async function getWorkers(options: ListOptions = {}): Promise<PageResult<DailyWorker>> {
  try {
    const response = await api.get("/workers", { params: options });
    const res = listResult<DailyWorker>(response.data, options);
    if (res.data.length > 0) return res;
  } catch {
    console.warn("Backend /workers unavailable, using local worker store.");
  }
  let workers = getStored<DailyWorker>(LOCAL_STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  
  workers = workers.map((w) => ({
    ...w,
    site: typeof w.site === "object" ? w.site : sites.find((s) => s.id === w.site_id) || w.site,
  }));

  if (options.search) {
    const q = options.search.toLowerCase();
    workers = workers.filter(
      (w) => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.phone.includes(q)
    );
  }
  if (options.site_id) {
    workers = workers.filter((w) => w.site_id === options.site_id);
  }
  return {
    data: workers,
    total: workers.length,
    page: options.page || 1,
    limit: options.limit || workers.length,
  };
}

export async function registerWorker(payload: RegisterWorkerInput): Promise<DailyWorker> {
  try {
    return unwrap<DailyWorker>(await api.post("/workers", payload));
  } catch {
    console.warn("Backend /workers POST unavailable, saving locally.");
  }
  const workers = getStored<DailyWorker>(LOCAL_STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  const assignedSite = sites.find((s) => s.id === payload.site_id);

  const newWorkerId = `TB-${String(workers.length + 1).padStart(4, "0")}`;
  const newWorker: DailyWorker = {
    id: newWorkerId,
    name: payload.name,
    phone: payload.phone,
    role: payload.role,
    site_id: payload.site_id,
    site: assignedSite,
    daily_wage: Number(payload.daily_wage),
    standard_hours: Number(payload.standard_hours || 8),
    status: "active",
    registered_at: new Date().toISOString(),
  };
  workers.unshift(newWorker);
  setStored(LOCAL_STORAGE_KEYS.WORKERS, workers);
  return newWorker;
}

export async function getWorker(workerId: string): Promise<DailyWorker> {
  try {
    return unwrap<DailyWorker>(await api.get(`/workers/${encodeURIComponent(workerId)}`));
  } catch {
    console.warn("Backend getWorker error, querying local store.");
  }
  const workers = getStored<DailyWorker>(LOCAL_STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) throw new Error(`Worker with ID ${workerId} not found`);
  return worker;
}

export async function getAttendance(workerId: string, date: string): Promise<DailyAttendance> {
  try {
    return unwrap<DailyAttendance>(await api.get(`/attendance/${encodeURIComponent(workerId)}/${encodeURIComponent(date)}`));
  } catch {
    console.warn("Backend getAttendance error, searching local attendance.");
  }
  const allAtt = getStored<DailyAttendance>(LOCAL_STORAGE_KEYS.ATTENDANCE, []);
  const att = allAtt.find((a) => a.worker_id === workerId && a.date === date);
  if (!att) {
    return {
      worker_id: workerId,
      site_id: "",
      date,
      status: "no_clock_in",
    };
  }
  return att;
}

export async function clockIn(workerId: string, siteId: string, location: LocationInput): Promise<DailyAttendance> {
  try {
    return unwrap<DailyAttendance>(await api.post("/attendance/clock-in", { worker_id: workerId, site_id: siteId, ...location }));
  } catch {
    console.warn("Backend clock-in unavailable, performing local geofence validation.");
  }
  const sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  const site = sites.find((s) => s.id === siteId);
  const dateStr = new Date().toISOString().split("T")[0];

  const distance = site
    ? calculateHaversineDistance(location.latitude, location.longitude, site.latitude, site.longitude)
    : 0;
  const radius = site?.geofence_radius || 100;
  const isVerified = distance <= radius;

  const attendance: DailyAttendance = {
    id: `att-${Date.now()}`,
    worker_id: workerId,
    site_id: siteId,
    date: dateStr,
    clock_in: {
      timestamp: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      distance_m: distance,
      status: isVerified ? "verified" : "rejected",
    },
    clock_in_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    clock_in_status: isVerified ? "verified" : "rejected",
    status: isVerified ? "clocked_in" : "rejected_geofence",
  };

  const allAtt = getStored<DailyAttendance>(LOCAL_STORAGE_KEYS.ATTENDANCE, []);
  const existingIdx = allAtt.findIndex((a) => a.worker_id === workerId && a.date === dateStr);
  if (existingIdx >= 0) {
    allAtt[existingIdx] = attendance;
  } else {
    allAtt.unshift(attendance);
  }
  setStored(LOCAL_STORAGE_KEYS.ATTENDANCE, allAtt);
  return attendance;
}

export async function clockOut(workerId: string, siteId: string, location: LocationInput): Promise<DailyAttendance> {
  try {
    return unwrap<DailyAttendance>(await api.post("/attendance/clock-out", { worker_id: workerId, site_id: siteId, ...location }));
  } catch {
    console.warn("Backend clock-out unavailable, performing local calculations.");
  }
  const dateStr = new Date().toISOString().split("T")[0];
  const allAtt = getStored<DailyAttendance>(LOCAL_STORAGE_KEYS.ATTENDANCE, []);
  const idx = allAtt.findIndex((a) => a.worker_id === workerId && a.date === dateStr);
  
  if (idx < 0 || !allAtt[idx].clock_in) {
    throw new Error("Cannot clock out without a valid clock-in record.");
  }

  const existing = allAtt[idx];
  const sites = getStored<PayoutSite>(LOCAL_STORAGE_KEYS.SITES, INITIAL_SITES);
  const site = sites.find((s) => s.id === siteId);

  const distance = site
    ? calculateHaversineDistance(location.latitude, location.longitude, site.latitude, site.longitude)
    : 0;
  const radius = site?.geofence_radius || 100;
  const isVerified = distance <= radius;

  const clockInTime = new Date(existing.clock_in!.timestamp!).getTime();
  const clockOutTime = new Date().getTime();
  const durationMs = Math.max(0, clockOutTime - clockInTime);
  const hoursWorked = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
  const hoursWorkedMinutes = Math.round(durationMs / (1000 * 60));

  const updated: DailyAttendance = {
    ...existing,
    clock_out: {
      timestamp: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      distance_m: distance,
      status: isVerified ? "verified" : "flagged",
    },
    clock_out_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    clock_out_status: isVerified ? "verified" : "flagged",
    hours_worked: hoursWorked,
    hours_worked_minutes: hoursWorkedMinutes,
    status: "completed",
  };

  allAtt[idx] = updated;
  setStored(LOCAL_STORAGE_KEYS.ATTENDANCE, allAtt);
  return updated;
}

export async function calculatePayout(workerId: string, attendanceId: string): Promise<DailyPayout> {
  try {
    return unwrap<DailyPayout>(await api.post("/payouts/calculate", { worker_id: workerId, attendance_id: attendanceId }));
  } catch {
    console.warn("Backend calculate payout unavailable, calculating wage client-authoritative preview.");
  }
  const workers = getStored<DailyWorker>(LOCAL_STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) throw new Error("Worker record not found for payout calculation");

  const allAtt = getStored<DailyAttendance>(LOCAL_STORAGE_KEYS.ATTENDANCE, []);
  const att = allAtt.find((a) => a.id === attendanceId || a.worker_id === workerId);
  
  if (!att || !att.hours_worked) {
    throw new Error("No completed clock-out attendance found to calculate payout.");
  }

  const standardHours = worker.standard_hours || 8;
  const dailyWage = worker.daily_wage || 7000;
  const hourlyRate = Math.round((dailyWage / standardHours) * 100) / 100;

  const payableHours = Math.min(att.hours_worked, standardHours);
  let amount = 0;
  if (att.hours_worked >= standardHours) {
    amount = dailyWage;
  } else {
    amount = Math.round(hourlyRate * att.hours_worked);
  }

  const dateTag = (att.date || new Date().toISOString().split("T")[0]).replace(/-/g, "");
  const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
  const reference = `TB-PAY-${dateTag}-${randomSuffix}`;

  const payout: DailyPayout = {
    id: `pay-${Date.now()}`,
    worker_id: worker.id,
    worker_name: worker.name,
    worker,
    attendance_id: att.id,
    site_id: worker.site_id,
    site_name: typeof worker.site === "object" ? worker.site?.name : "Site",
    date: att.date,
    daily_wage: dailyWage,
    hourly_rate: hourlyRate,
    payable_hours: payableHours,
    hours_worked: att.hours_worked,
    amount,
    status: "pending",
    reference,
    attendance: att,
    generated_at: new Date().toISOString(),
  };

  const payouts = getStored<DailyPayout>(LOCAL_STORAGE_KEYS.PAYOUTS, []);
  const existingIdx = payouts.findIndex((p) => p.worker_id === workerId && p.date === att.date);
  if (existingIdx >= 0) {
    payouts[existingIdx] = payout;
  } else {
    payouts.unshift(payout);
  }
  setStored(LOCAL_STORAGE_KEYS.PAYOUTS, payouts);
  return payout;
}

export async function getPayouts(options: ListOptions = {}): Promise<PageResult<DailyPayout>> {
  try {
    const response = await api.get("/payouts", { params: options });
    const res = listResult<DailyPayout>(response.data, options);
    if (res.data.length > 0) return res;
  } catch {
    console.warn("Backend /payouts unavailable, using local payouts store.");
  }

  let payouts = getStored<DailyPayout>(LOCAL_STORAGE_KEYS.PAYOUTS, []);
  if (payouts.length === 0) {
    // Generate initial sample payout for demo Musa Ibrahim
    const sampleWorker = INITIAL_WORKERS[0];
    const sampleSite = INITIAL_SITES[0];
    payouts = [
      {
        id: "pay-1001",
        worker_id: sampleWorker.id,
        worker_name: sampleWorker.name,
        worker: sampleWorker,
        site_id: sampleSite.id,
        site_name: sampleSite.name,
        date: new Date().toISOString().split("T")[0],
        daily_wage: 7000,
        hourly_rate: 875,
        payable_hours: 7.58,
        hours_worked: 7.58,
        amount: 6632,
        status: "pending",
        reference: `TB-PAY-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-8821`,
        attendance: {
          id: "att-1001",
          worker_id: sampleWorker.id,
          site_id: sampleSite.id,
          date: new Date().toISOString().split("T")[0],
          clock_in_time: "07:55 AM",
          clock_out_time: "03:30 PM",
          clock_in_status: "verified",
          clock_out_status: "verified",
          hours_worked: 7.58,
          status: "completed",
          clock_in: { timestamp: new Date().toISOString(), distance_m: 12, status: "verified" },
          clock_out: { timestamp: new Date().toISOString(), distance_m: 18, status: "verified" },
        },
        generated_at: new Date().toISOString(),
      },
    ];
    setStored(LOCAL_STORAGE_KEYS.PAYOUTS, payouts);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    payouts = payouts.filter(
      (p) =>
        p.worker_name?.toLowerCase().includes(q) ||
        p.worker_id.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
    );
  }
  if (options.site_id) {
    payouts = payouts.filter((p) => p.site_id === options.site_id);
  }
  if (options.status) {
    payouts = payouts.filter((p) => p.status === options.status);
  }
  if (options.date) {
    payouts = payouts.filter((p) => p.date === options.date);
  }

  return {
    data: payouts,
    total: payouts.length,
    page: options.page || 1,
    limit: options.limit || payouts.length,
  };
}

export async function approvePayout(payoutId: string): Promise<DailyPayout> {
  try {
    return unwrap<DailyPayout>(await api.post(`/payouts/${encodeURIComponent(payoutId)}/approve`));
  } catch {
    console.warn("Backend /payouts approve unavailable, performing local approval.");
  }
  const payouts = getStored<DailyPayout>(LOCAL_STORAGE_KEYS.PAYOUTS, []);
  const idx = payouts.findIndex((p) => p.id === payoutId);
  if (idx < 0) throw new Error("Payout record not found");
  payouts[idx].status = "approved";
  setStored(LOCAL_STORAGE_KEYS.PAYOUTS, payouts);
  return payouts[idx];
}

export async function markPayoutPaid(payoutId: string, paymentReference: string): Promise<DailyPayout> {
  try {
    return unwrap<DailyPayout>(
      await api.post(`/payouts/${encodeURIComponent(payoutId)}/paid`, { payment_reference: paymentReference })
    );
  } catch {
    console.warn("Backend /payouts paid unavailable, recording local payment.");
  }
  const payouts = getStored<DailyPayout>(LOCAL_STORAGE_KEYS.PAYOUTS, []);
  const idx = payouts.findIndex((p) => p.id === payoutId);
  if (idx < 0) throw new Error("Payout record not found");
  payouts[idx].status = "paid";
  payouts[idx].paid_at = new Date().toISOString();
  payouts[idx].payment_reference = paymentReference;
  setStored(LOCAL_STORAGE_KEYS.PAYOUTS, payouts);
  return payouts[idx];
}

export async function getPayoutSlip(payoutId: string): Promise<PayoutSlip> {
  try {
    return unwrap<PayoutSlip>(await api.get(`/payouts/${encodeURIComponent(payoutId)}/slip`));
  } catch {
    console.warn("Backend /payouts/slip unavailable, generating slip record.");
  }
  const payouts = getStored<DailyPayout>(LOCAL_STORAGE_KEYS.PAYOUTS, []);
  const payout = payouts.find((p) => p.id === payoutId);
  if (!payout) throw new Error("Payout not found for slip generation");

  const hours = payout.hours_worked || 0;
  const hoursInt = Math.floor(hours);
  const minutesInt = Math.round((hours - hoursInt) * 60);

  return {
    company_name: "TraccBOX Construction Ltd",
    payout_reference: payout.reference,
    worker_name: payout.worker_name || payout.worker?.name,
    worker_id: payout.worker_id,
    role: payout.worker?.role || "Site Worker",
    site_name: payout.site_name || "Construction Site",
    work_date: payout.date,
    clock_in: payout.attendance?.clock_in || { timestamp: new Date().toISOString(), status: "verified" },
    clock_out: payout.attendance?.clock_out || { timestamp: new Date().toISOString(), status: "verified" },
    hours_worked: payout.hours_worked,
    hours_formatted: `${hoursInt}h ${minutesInt}m`,
    daily_wage: payout.daily_wage,
    hourly_rate: payout.hourly_rate || Math.round((payout.daily_wage / 8) * 100) / 100,
    workday_type: hours >= (payout.worker?.standard_hours || 8) ? "Full-Day" : "Partial-Day (Prorated)",
    amount: payout.amount,
    status: payout.status,
    payment_reference: payout.payment_reference,
    paid_at: payout.paid_at,
    generated_at: payout.generated_at || new Date().toISOString(),
  };
}

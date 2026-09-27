import api from "@/api/AxiosInstance";
import type {
  CreateSiteInput, DailyAttendance, DailyPayout, DailyWorker, ListOptions,
  LocationInput, PageResult, PayoutSite, PayoutSlip, RegisterWorkerInput,
} from "./types";

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
  const response = await api.get("/sites", { params: options });
  return listResult<PayoutSite>(response.data, options);
}
export async function createSite(payload: CreateSiteInput): Promise<PayoutSite> {
  return unwrap<PayoutSite>(await api.post("/sites", payload));
}
export async function getWorkers(options: ListOptions = {}): Promise<PageResult<DailyWorker>> {
  const response = await api.get("/workers", { params: options });
  return listResult<DailyWorker>(response.data, options);
}
export async function registerWorker(payload: RegisterWorkerInput): Promise<DailyWorker> {
  return unwrap<DailyWorker>(await api.post("/workers", payload));
}
export async function getWorker(workerId: string): Promise<DailyWorker> {
  return unwrap<DailyWorker>(await api.get(`/workers/${encodeURIComponent(workerId)}`));
}
export async function getAttendance(workerId: string, date: string): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(await api.get(`/attendance/${encodeURIComponent(workerId)}/${encodeURIComponent(date)}`));
}
export async function clockIn(workerId: string, siteId: string, location: LocationInput): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(await api.post("/attendance/clock-in", { worker_id: workerId, site_id: siteId, ...location }));
}
export async function clockOut(workerId: string, siteId: string, location: LocationInput): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(await api.post("/attendance/clock-out", { worker_id: workerId, site_id: siteId, ...location }));
}
export async function calculatePayout(workerId: string, attendanceId: string): Promise<DailyPayout> {
  return unwrap<DailyPayout>(await api.post("/payouts/calculate", { worker_id: workerId, attendance_id: attendanceId }));
}
export async function getPayouts(options: ListOptions = {}): Promise<PageResult<DailyPayout>> {
  const response = await api.get("/payouts", { params: options });
  return listResult<DailyPayout>(response.data, options);
}
export async function approvePayout(payoutId: string): Promise<DailyPayout> {
  return unwrap<DailyPayout>(await api.post(`/payouts/${encodeURIComponent(payoutId)}/approve`));
}
export async function markPayoutPaid(payoutId: string, paymentReference: string): Promise<DailyPayout> {
  return unwrap<DailyPayout>(await api.post(`/payouts/${encodeURIComponent(payoutId)}/paid`, { payment_reference: paymentReference }));
}
export async function getPayoutSlip(payoutId: string): Promise<PayoutSlip> {
  return unwrap<PayoutSlip>(await api.get(`/payouts/${encodeURIComponent(payoutId)}/slip`));
}

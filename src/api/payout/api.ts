import api from "@/api/AxiosInstance";
import type {
  DailyAttendance,
  DailyPayout,
  DailyWorker,
  ListOptions,
  LocationInput,
  PageResult,
  PayoutSite,
  PayoutSlip,
  PayoutSummary,
  RegisterWorkerInput,
} from "./types";

const unwrap = <T>(response: any): T =>
  (response?.data?.data ?? response?.data?.result ?? response?.data) as T;

const toPage = <T>(response: any, options: ListOptions = {}): PageResult<T> => {
  const body = response?.data ?? response?.results ?? response;
  const data = Array.isArray(body)
    ? body
    : (body?.items ?? body?.results ?? body?.data ?? []);
  const meta = response?.meta ?? body?.meta ?? {};
  return {
    data,
    total: Number(meta.total ?? body?.total ?? response?.total ?? data.length),
    page: Number(
      meta.page ?? body?.page ?? response?.page ?? options.page ?? 1,
    ),
    limit: Number(
      meta.limit ??
        body?.limit ??
        response?.limit ??
        options.limit ??
        data.length,
    ),
  };
};

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function getSites(
  options: ListOptions = {},
): Promise<PageResult<PayoutSite>> {
  const page = toPage<PayoutSite>(
    (await api.get("/sites", { params: options })).data,
    options,
  );
  return { ...page, data: page.data.map(site => {
    const boundary = site.locations?.length === 1 ? site.locations[0].boundary : undefined;
    if (site.latitude == null && boundary?.kind === "circle" && boundary.center) {
      return { ...site, latitude: boundary.center[0], longitude: boundary.center[1], geofence_radius: boundary.radius };
    }
    return site;
  }) };
}
export async function getWorkers(
  options: ListOptions = {},
): Promise<PageResult<DailyWorker>> {
  return toPage<DailyWorker>(
    (await api.get("/workers", { params: options })).data,
    options,
  );
}
export async function registerWorker(
  payload: RegisterWorkerInput,
): Promise<DailyWorker> {
  const { staff_id, site_id, daily_wage, standard_hours, payment_method, bank_name, account_number, account_name } = payload;
  if (payment_method === "transfer" && (!bank_name || !account_number || !account_name)) {
    throw new Error("Bank name, account number, and account name are required for transfer payments.");
  }
  return unwrap<DailyWorker>(await api.post("/workers", {
    staff_id, site_id, daily_wage, standard_hours, payment_method,
    ...(payment_method === "transfer" ? { bank_name, account_number, account_name } : {}),
  }));
}
export async function getWorker(id: string): Promise<DailyWorker> {
  return unwrap<DailyWorker>(
    await api.get(`/workers/${encodeURIComponent(id)}`),
  );
}
export async function getWorkerAttendance(
  id: string,
  from?: string,
  to?: string,
): Promise<PageResult<DailyAttendance>> {
  return toPage<DailyAttendance>(
    (
      await api.get(`/workers/${encodeURIComponent(id)}/attendance`, {
        params: { from, to },
      })
    ).data,
  );
}
export async function getWorkerPayouts(
  id: string,
  from?: string,
  to?: string,
): Promise<PageResult<DailyPayout>> {
  return toPage<DailyPayout>(
    (
      await api.get(`/workers/${encodeURIComponent(id)}/payouts`, {
        params: { from, to },
      })
    ).data,
  );
}
export async function getAttendance(
  id: string,
  date: string,
): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(
    await api.get(
      `/attendance/${encodeURIComponent(id)}/${encodeURIComponent(date)}`,
    ),
  );
}
export async function getAttendanceList(
  options: ListOptions = {},
): Promise<PageResult<DailyAttendance>> {
  return toPage<DailyAttendance>(
    (await api.get("/attendance", { params: options })).data,
    options,
  );
}
export async function clockIn(
  workerId: string,
  siteId: string,
  location: LocationInput,
): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(
    await api.post("/attendance/clock-in", {
      worker_id: workerId,
      site_id: siteId,
      ...location,
    }),
  );
}
export async function clockOut(
  workerId: string,
  siteId: string,
  location: LocationInput,
): Promise<DailyAttendance> {
  return unwrap<DailyAttendance>(
    await api.post("/attendance/clock-out", {
      worker_id: workerId,
      site_id: siteId,
      ...location,
    }),
  );
}
export async function calculatePayout(
  workerId: string,
  attendanceId: string,
): Promise<DailyPayout> {
  return unwrap<DailyPayout>(
    await api.post("/payouts/calculate", {
      worker_id: workerId,
      attendance_id: attendanceId,
    }),
  );
}
export async function getPayouts(
  options: ListOptions = {},
): Promise<PageResult<DailyPayout>> {
  return toPage<DailyPayout>(
    (await api.get("/payouts", { params: options })).data,
    options,
  );
}
export async function getPayoutSummary(
  options: ListOptions = {},
): Promise<PayoutSummary> {
  return unwrap<PayoutSummary>(
    await api.get("/payouts/summary", { params: options }),
  );
}
export async function approvePayout(
  id: string,
  note?: string,
): Promise<DailyPayout> {
  return unwrap<DailyPayout>(
    await api.post(
      `/payouts/${encodeURIComponent(id)}/approve`,
      note ? { note } : undefined,
    ),
  );
}
export async function markPayoutPaid(
  id: string,
  paymentMethod: "cash" | "transfer",
  paymentReference: string,
  note?: string,
): Promise<DailyPayout> {
  return unwrap<DailyPayout>(
    await api.post(`/payouts/${encodeURIComponent(id)}/paid`, {
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      note,
    }),
  );
}
export async function getPayoutSlip(id: string): Promise<PayoutSlip> {
  return unwrap<PayoutSlip>(
    await api.get(`/payouts/${encodeURIComponent(id)}/slip`),
  );
}
export async function exportPayouts(
  options: Pick<ListOptions, "from" | "to" | "status" | "site_id"> = {},
): Promise<Blob> {
  return (
    await api.get("/payouts/export", {
      params: { format: "csv", ...options },
      responseType: "blob",
    })
  ).data as Blob;
}

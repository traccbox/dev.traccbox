import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  approvePayout,
  calculateHaversineDistance,
  calculatePayout,
  clockIn,
  clockOut,
  getAttendance,
  getAttendanceList,
  getPayouts,
  getPayoutSummary,
  exportPayouts,
  getPayoutSlip,
  getSites,
  getWorker,
  getWorkers,
  markPayoutPaid,
  registerWorker,
} from "./api";
import api from "@/api/AxiosInstance";
import type { ListOptions, LocationInput, RegisterWorkerInput } from "./types";
import { toast } from "sonner";

export { calculateHaversineDistance };

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: import("./types").CreateSiteInput) => {
      const response = await api.post("/work-areas", {
        name: payload.name,
        description: payload.project,
        type: "construction_site",
        status: "active",
        locations: [
          {
            name: payload.name,
            method: "manual",
            boundary: {
              kind: "circle",
              center: [payload.latitude, payload.longitude],
              radius: payload.geofence_radius,
            },
            address: payload.address,
          },
        ],
      });
      return response.data?.data ?? response.data;
    },
    onSuccess: () => {
      toast.success("Construction site registered");
      queryClient.invalidateQueries({ queryKey: ["payout-sites"] });
      queryClient.invalidateQueries({ queryKey: ["payout-sites-infinite"] });
    },
    onError: (err: any) =>
      toast.error(err?.message || "Failed to create construction site"),
  });
}

export const PAYOUT_QUERY_KEYS = {
  sites: (options?: ListOptions) => ["payout-sites", options] as const,
  workers: (options?: ListOptions) => ["payout-workers", options] as const,
  worker: (id: string) => ["payout-worker", id] as const,
  attendance: (workerId: string, date: string) =>
    ["payout-attendance", workerId, date] as const,
  attendanceList: (options?: ListOptions) =>
    ["payout-attendance-list", options] as const,
  payouts: (options?: ListOptions) => ["payouts", options] as const,
  summary: (options?: ListOptions) => ["payout-summary", options] as const,
  slip: (payoutId: string) => ["payout-slip", payoutId] as const,
};

export function useSites(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.sites(options),
    queryFn: () => getSites(options),
  });
}

export function useInfiniteSites() {
  return useInfiniteQuery({
    queryKey: ["payout-sites-infinite"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getSites({ page: pageParam, limit: 25 }),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });
}

export function useWorkers(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.workers(options),
    queryFn: () => getWorkers(options),
  });
}

export function useRegisterWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterWorkerInput) => registerWorker(payload),
    onSuccess: (data) => {
      toast.success(`Worker ${data.name} registered (ID: ${data.id})`);
      queryClient.invalidateQueries({ queryKey: ["payout-workers"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to register worker");
    },
  });
}

export function useWorkerDetails(workerId: string) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.worker(workerId),
    queryFn: () => getWorker(workerId),
    enabled: !!workerId,
  });
}

export function useDailyAttendance(workerId: string, date: string) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.attendance(workerId, date),
    queryFn: () => getAttendance(workerId, date),
    enabled: !!workerId && !!date,
  });
}

export function useAttendanceList(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.attendanceList(options),
    queryFn: () => getAttendanceList(options),
  });
}

export function usePayoutSummary(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.summary(options),
    queryFn: () => getPayoutSummary(options),
  });
}

export function useExportPayouts() {
  return useMutation({ mutationFn: exportPayouts });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      siteId,
      location,
    }: {
      workerId: string;
      siteId: string;
      location: LocationInput;
    }) => clockIn(workerId, siteId, location),
    onSuccess: (data) => {
      if (data.clock_in_status === "verified") {
        toast.success("Clock-In Verified! Inside site boundary.");
      } else {
        toast.warning("Clock-In Flagged/Rejected! Outside site boundary.");
      }
      queryClient.invalidateQueries({ queryKey: ["payout-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payout-attendance-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Clock-in failed");
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      siteId,
      location,
    }: {
      workerId: string;
      siteId: string;
      location: LocationInput;
    }) => clockOut(workerId, siteId, location),
    onSuccess: (data) => {
      toast.success(
        `Clock-Out recorded! Hours worked: ${data.hours_worked || 0}h`,
      );
      queryClient.invalidateQueries({ queryKey: ["payout-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Clock-out failed");
    },
  });
}

export function useCalculatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      attendanceId,
    }: {
      workerId: string;
      attendanceId: string;
    }) => calculatePayout(workerId, attendanceId),
    onSuccess: (data) => {
      toast.success(
        `Payout calculated: ₦${data.amount.toLocaleString()} (Ref: ${data.reference})`,
      );
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payout-attendance-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to calculate payout");
    },
  });
}

export function usePayouts(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.payouts(options),
    queryFn: () => getPayouts(options),
  });
}

export function useApprovePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: string) => approvePayout(payoutId),
    onSuccess: () => {
      toast.success("Payout approved!");
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to approve payout");
    },
  });
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payoutId,
      paymentReference,
      paymentMethod,
      note,
    }: {
      payoutId: string;
      paymentReference: string;
      paymentMethod: "cash" | "transfer";
      note?: string;
    }) => markPayoutPaid(payoutId, paymentMethod, paymentReference, note),
    onSuccess: (data) => {
      toast.success(`Payment confirmed! Ref: ${data.payment_reference}`);
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to mark payout as paid");
    },
  });
}

export function usePayoutSlip(payoutId: string) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.slip(payoutId),
    queryFn: () => getPayoutSlip(payoutId),
    enabled: !!payoutId,
  });
}

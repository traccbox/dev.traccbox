import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approvePayout,
  calculateHaversineDistance,
  calculatePayout,
  clockIn,
  clockOut,
  createSite,
  getAttendance,
  getPayouts,
  getPayoutSlip,
  getSites,
  getWorker,
  getWorkers,
  markPayoutPaid,
  registerWorker,
} from "./api";
import type {
  CreateSiteInput,
  ListOptions,
  LocationInput,
  RegisterWorkerInput,
} from "./types";
import { toast } from "sonner";

export { calculateHaversineDistance };

export const PAYOUT_QUERY_KEYS = {
  sites: (options?: ListOptions) => ["payout-sites", options] as const,
  workers: (options?: ListOptions) => ["payout-workers", options] as const,
  worker: (id: string) => ["payout-worker", id] as const,
  attendance: (workerId: string, date: string) => ["payout-attendance", workerId, date] as const,
  payouts: (options?: ListOptions) => ["payouts", options] as const,
  slip: (payoutId: string) => ["payout-slip", payoutId] as const,
};

export function useSites(options: ListOptions = {}) {
  return useQuery({
    queryKey: PAYOUT_QUERY_KEYS.sites(options),
    queryFn: () => getSites(options),
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSiteInput) => createSite(payload),
    onSuccess: () => {
      toast.success("Construction site registered successfully");
      queryClient.invalidateQueries({ queryKey: ["payout-sites"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create construction site");
    },
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
      toast.success(`Clock-Out recorded! Hours worked: ${data.hours_worked || 0}h`);
      queryClient.invalidateQueries({ queryKey: ["payout-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Clock-out failed");
    },
  });
}

export function useCalculatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, attendanceId }: { workerId: string; attendanceId: string }) =>
      calculatePayout(workerId, attendanceId),
    onSuccess: (data) => {
      toast.success(`Payout calculated: ₦${data.amount.toLocaleString()} (Ref: ${data.reference})`);
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
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
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to approve payout");
    },
  });
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payoutId, paymentReference }: { payoutId: string; paymentReference: string }) =>
      markPayoutPaid(payoutId, paymentReference),
    onSuccess: (data) => {
      toast.success(`Payment confirmed! Ref: ${data.payment_reference}`);
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
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

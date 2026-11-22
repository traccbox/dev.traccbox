export type PayoutStatus = "pending" | "approved" | "paid";
export type GeofenceStatus = "verified" | "rejected" | "flagged" | "unverified" | "unable_to_verify";
export type PaymentMethod = "cash" | "transfer";

export interface PayoutSite {
  id: string;
  name: string;
  project?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  status?: string;
  address?: string;
}

export interface DailyWorker {
  id: string;
  staff_id?: string;
  name: string;
  phone: string;
  email?: string;
  role?: string;
  site_id?: string;
  site?: PayoutSite | string;
  daily_wage: number;
  standard_hours: number;
  payment_method?: PaymentMethod;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  status?: string;
  registered_at?: string;
}

export interface GeoEvidence {
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  distance_m?: number;
  status?: GeofenceStatus;
}

export interface DailyAttendance {
  id?: string;
  worker_id: string;
  site_id: string;
  date: string;
  clock_in?: GeoEvidence;
  clock_out?: GeoEvidence;
  clock_in_time?: string;
  clock_out_time?: string;
  clock_in_status?: GeofenceStatus;
  clock_out_status?: GeofenceStatus;
  hours_worked?: number;
  hours_worked_minutes?: number;
  status?: string;
}

export interface DailyPayout {
  id: string;
  worker_id: string;
  staff_id?: string;
  worker_name?: string;
  worker?: DailyWorker;
  attendance_id?: string;
  site_id?: string;
  site_name?: string;
  date: string;
  daily_wage: number;
  hourly_rate?: number;
  payable_hours?: number;
  hours_worked?: number;
  amount: number;
  status: PayoutStatus;
  reference: string;
  payment_method?: PaymentMethod;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  attendance?: DailyAttendance;
  generated_at?: string;
  approved_at?: string;
  paid_at?: string;
  payment_reference?: string;
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  date?: string;
  from?: string;
  to?: string;
  site_id?: string;
  status?: string;
  payment_method?: string;
}

export interface LocationInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface RegisterWorkerInput {
  staff_id?: string;
  name: string;
  phone: string;
  role: string;
  site_id: string;
  daily_wage: number;
  standard_hours: number;
  payment_method?: PaymentMethod;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

export interface CreateSiteInput {
  name: string;
  project?: string;
  address?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
}

export interface PayoutSlip {
  company_name?: string;
  payout_reference?: string;
  worker_name?: string;
  worker_id?: string;
  staff_id?: string;
  role?: string;
  site_name?: string;
  work_date?: string;
  clock_in?: GeoEvidence;
  clock_out?: GeoEvidence;
  hours_worked?: number;
  daily_wage?: number;
  hourly_rate?: number;
  workday_type?: string;
  amount?: number;
  payment_method?: PaymentMethod;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  status?: PayoutStatus;
  generated_at?: string;
  approved_at?: string;
  paid_at?: string;
  payment_reference?: string;
  [key: string]: unknown;
}

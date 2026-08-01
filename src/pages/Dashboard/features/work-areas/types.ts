export type WorkAreaType =
  | "office"
  | "branch"
  | "sales_territory"
  | "warehouse"
  | "service_zone"
  | "delivery_zone"
  | "client_location"
  | "construction_site"
  | "market"
  | "custom";

export const WORK_AREA_TYPE_OPTIONS: { value: WorkAreaType; label: string }[] = [
  { value: "office", label: "Office / Branch" },
  { value: "sales_territory", label: "Sales Territory" },
  { value: "warehouse", label: "Warehouse" },
  { value: "service_zone", label: "Service Zone" },
  { value: "delivery_zone", label: "Delivery Zone" },
  { value: "client_location", label: "Client Location" },
  { value: "construction_site", label: "Construction Site" },
  { value: "market", label: "Market" },
  { value: "custom", label: "Custom" },
];

export type WorkAreaStatus = "active" | "inactive";

export type BoundaryShape =
  | { kind: "circle"; center: [number, number]; radius: number }
  | { kind: "polygon"; points: [number, number][] };

export interface WorkAreaEmployee {
  id: string;
  name: string;
  role?: string;
  department?: string;
  team?: string;
  avatar?: string;
  status?: "inside" | "near" | "outside" | "offline";
}

export interface WorkAreaRules {
  workingDays: string[];
  workingHours: { start: string; end: string };
  allowClockIn: boolean;
  allowClockOut: boolean;
  gpsAccuracy: number; // meters
  allowOffline: boolean;
  gracePeriod: number; // minutes
  autoCheckIn: boolean;
  autoCheckOut: boolean;
  entryNotification: boolean;
  exitNotification: boolean;
  violationAlerts: boolean;
}

export interface WorkAreaLocation {
  id: string;
  name: string;
  method: "draw" | "admin" | "manual";
  boundary: BoundaryShape;
  address?: string;
  country?: string;
  state?: string;
  lga?: string;
  ward?: string;
  community?: string;
}

export interface WorkArea {
  id: string;
  name: string;
  description?: string;
  type: WorkAreaType;
  status: WorkAreaStatus;
  /** Primary boundary (first location) — kept for backwards compatibility. */
  boundary: BoundaryShape;
  /** A work area can contain multiple locations/boundaries. */
  locations?: WorkAreaLocation[];
  address?: string;
  country?: string;
  state?: string;
  lga?: string;
  ward?: string;
  community?: string;
  employees: WorkAreaEmployee[];
  rules: WorkAreaRules;
  createdAt: string;
}

export const DEFAULT_RULES: WorkAreaRules = {
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  workingHours: { start: "08:00", end: "17:00" },
  allowClockIn: true,
  allowClockOut: true,
  gpsAccuracy: 50,
  allowOffline: false,
  gracePeriod: 10,
  autoCheckIn: false,
  autoCheckOut: false,
  entryNotification: true,
  exitNotification: true,
  violationAlerts: true,
};

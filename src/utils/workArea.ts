import { CreateWorkAreaPayload } from "@/api/geoFencing/typesGeoFencing";

export const WORK_AREA_STORAGE_KEY = "create_work_area";

export const INITIAL_WORK_AREA: CreateWorkAreaPayload = {
  name: "",
  description: "",
  type: "office",
  status: "active",
  locations: [],
  employee_ids: [],
  rules: {
    working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    working_hours: {
      start: "08:00",
      end: "17:00",
    },
    allow_clock_in: true,
    allow_clock_out: true,
    gps_accuracy: 50,
    allow_offline: false,
    grace_period: 10,
    auto_check_in: false,
    auto_check_out: false,
    entry_notification: true,
    exit_notification: true,
    violation_alerts: true,
  },
};

export const RULE_OPTIONS = [
  ["allow_clock_in", "Allow Clock In"],
  ["allow_clock_out", "Allow Clock Out"],
  ["allow_offline", "Allow Offline"],
  ["auto_check_in", "Auto Check In"],
  ["auto_check_out", "Auto Check Out"],
  ["entry_notification", "Entry Notification"],
  ["exit_notification", "Exit Notification"],
  ["violation_alerts", "Violation Alerts"],
] as const;

export function getStoredWorkArea(): CreateWorkAreaPayload {
  const stored = localStorage.getItem(WORK_AREA_STORAGE_KEY);

  if (!stored) {
    return INITIAL_WORK_AREA;
  }

  try {
    return JSON.parse(stored) as CreateWorkAreaPayload;
  } catch {
    return INITIAL_WORK_AREA;
  }
}

export function updateStoredWorkArea(
  updates: Partial<CreateWorkAreaPayload>,
): void {
  const current = getStoredWorkArea();

  const updated = {
    ...current,
    ...updates,
  };

  localStorage.setItem(WORK_AREA_STORAGE_KEY, JSON.stringify(updated));
}

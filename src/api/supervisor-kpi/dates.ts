/** Local-date helpers. Reports and payroll periods are calendar concepts, not UTC instants. */

export const ymd = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const currentPeriod = (now = new Date()): string => ymd(now).slice(0, 7);

/** [start, end] of a YYYY-MM period as local dates (end is the last day, 23:59:59). */
export const periodRange = (period: string): [Date, Date] => {
  const [y, m] = period.split("-").map(Number);
  return [new Date(y, m - 1, 1, 0, 0, 0, 0), new Date(y, m, 0, 23, 59, 59, 999)];
};

export const shiftPeriod = (period: string, delta: number): string => {
  const [y, m] = period.split("-").map(Number);
  return currentPeriod(new Date(y, m - 1 + delta, 1));
};

export const periodLabel = (period: string): string => {
  const [start] = periodRange(period);
  return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export const inRange = (iso: string, [start, end]: [Date, Date]): boolean => {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

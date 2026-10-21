/**
 * TimePicker12h
 * Renders a 12-hour time picker (hour + minute + AM/PM selects).
 * Accepts and emits values in 24-hour "HH:MM" format so the rest of the
 * app / API layer stays unchanged.
 */

import React from "react";

// ── helpers ────────────────────────────────────────────────────────────────

/** Convert a 24-h "HH:MM" string → { hour12, minute, period } */
function from24(value: string): { hour12: string; minute: string; period: "AM" | "PM" } {
  const [hStr, mStr] = (value ?? "").split(":");
  const h24 = parseInt(hStr ?? "0", 10);
  const minute = mStr ?? "00";
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12: String(h12), minute, period };
}

/** Convert { hour12, minute, period } → 24-h "HH:MM" string */
function to24(hour12: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(hour12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// ── component ──────────────────────────────────────────────────────────────

interface Props {
  /** 24-hour "HH:MM" string */
  value: string;
  onChange: (value24h: string) => void;
  className?: string;
}

export default function TimePicker12h({ value, onChange, className = "" }: Props) {
  const { hour12, minute, period } = from24(value);

  const handleHour = (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange(to24(e.target.value, minute, period));

  const handleMinute = (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange(to24(hour12, e.target.value, period));

  const handlePeriod = (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange(to24(hour12, minute, e.target.value as "AM" | "PM"));

  const selectCls =
    "px-2 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1658E5] cursor-pointer";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Hour */}
      <select value={hour12} onChange={handleHour} className={selectCls}>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-gray-500 font-semibold text-sm">:</span>

      {/* Minute */}
      <select value={minute} onChange={handleMinute} className={selectCls}>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* AM / PM */}
      <select value={period} onChange={handlePeriod} className={`${selectCls} font-semibold`}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

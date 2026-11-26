import React, { useState } from "react";
import {
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  useAttendanceList,
  useCalculatePayout,
  usePayouts,
} from "@/api/payout/hooks";
import type { DailyAttendance, DailyPayout } from "@/api/payout/types";
import PayoutSlipModal from "./PayoutSlipModal";
import SitePicker from "./SitePicker";

const eventTime = (time?: string, timestamp?: string) =>
  time ||
  (timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—");

export default function DailyAttendanceBoard() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");
  const [slip, setSlip] = useState<DailyPayout | null>(null);
  const attendanceQuery = useAttendanceList({
    date,
    site_id: siteId || undefined,
    search: search || undefined,
  });
  const payoutsQuery = usePayouts({ date, site_id: siteId || undefined });
  const calculate = useCalculatePayout();
  const rows = attendanceQuery.data?.data || [];
  const payouts = payoutsQuery.data?.data || [];
  const getPayout = (attendance: DailyAttendance) =>
    payouts.find(
      (p) =>
        p.attendance_id === attendance.id ||
        p.worker_id === attendance.worker_id,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Daily Attendance & Geofence Logs
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server verified clock events, GPS evidence and hours worked.
          </p>
        </div>
        <button
          onClick={() => {
            attendanceQuery.refetch();
            payoutsQuery.refetch();
          }}
          className="px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Attendance
        </button>
      </div>
      <div className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker by name, ID, role..."
            className="w-full pl-9 p-2 border rounded-xl text-sm"
          />
        </div>
        <SitePicker value={siteId} onChange={setSiteId} className="p-2 border rounded-xl bg-white text-left" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded-xl"
        />
      </div>
      <div className="bg-white border rounded-2xl overflow-hidden">
        {attendanceQuery.isLoading ? (
          <div className="p-12 text-center text-slate-500">
            Loading attendance…
          </div>
        ) : attendanceQuery.isError ? (
          <div className="p-12 text-center text-red-600">
            Could not load attendance. Check access and try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No attendance records for these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  {[
                    "Worker Details",
                    "Assigned Site",
                    "Clock-In Event",
                    "Clock-Out Event",
                    "Hours Calculated",
                    "Geofence Status",
                    "Actions",
                  ].map((x) => (
                    <th key={x} className="p-4">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((a) => {
                  const payout = getPayout(a);
                  const inStatus = a.clock_in?.status || a.clock_in_status;
                  const outStatus = a.clock_out?.status || a.clock_out_status;
                  const eligible =
                    !!a.id &&
                    !!a.clock_in &&
                    !!a.clock_out &&
                    inStatus !== "rejected" &&
                    outStatus !== "rejected";
                  const hrs = a.hours_worked;
                  const mins =
                    a.hours_worked_minutes ??
                    (hrs == null ? undefined : Math.round(hrs * 60));
                  return (
                    <tr
                      key={a.id || `${a.worker_id}-${a.date}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <b>{a.worker_name || a.worker?.name || a.worker_id}</b>
                        <div className="text-slate-500">
                          {a.worker_id}
                          {a.worker?.role ? ` · ${a.worker.role}` : ""}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 items-center">
                          <Building2 className="w-3 h-3" />
                          {a.site_name || a.site_id}
                        </div>
                        <span className="text-slate-400">{a.date}</span>
                      </td>
                      <td className="p-4">
                        <b>
                          {eventTime(a.clock_in_time, a.clock_in?.timestamp)}
                        </b>
                        <div className="text-slate-500">
                          <MapPin className="inline w-3 h-3" />{" "}
                          {a.clock_in?.distance_m == null
                            ? "GPS evidence unavailable"
                            : `${a.clock_in.distance_m}m from edge`}{" "}
                          · {inStatus || "pending"}
                        </div>
                      </td>
                      <td className="p-4">
                        <b>
                          {eventTime(a.clock_out_time, a.clock_out?.timestamp)}
                        </b>
                        <div className="text-slate-500">
                          <MapPin className="inline w-3 h-3" />{" "}
                          {a.clock_out?.distance_m == null
                            ? "GPS evidence unavailable"
                            : `${a.clock_out.distance_m}m from edge`}{" "}
                          · {outStatus || "pending"}
                        </div>
                      </td>
                      <td className="p-4">
                        {mins == null
                          ? "—"
                          : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                        <div className="text-slate-500">{a.status || "—"}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            inStatus === "verified" && outStatus === "verified"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }
                        >
                          <CheckCircle2 className="inline w-3 h-3 mr-1" />
                          {inStatus || "pending"} / {outStatus || "pending"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {payout ? (
                          <button
                            onClick={() => setSlip(payout)}
                            className="px-2 py-1 border rounded-lg"
                          >
                            <FileText className="inline w-3 h-3 mr-1" />
                            View Slip
                          </button>
                        ) : (
                          <button
                            disabled={!eligible || calculate.isPending}
                            onClick={() =>
                              a.id &&
                              calculate.mutate({
                                workerId: a.worker_id,
                                attendanceId: a.id,
                              })
                            }
                            className="px-2 py-1 bg-blue-600 text-white rounded-lg disabled:opacity-40"
                          >
                            <Calculator className="inline w-3 h-3 mr-1" />
                            Calculate Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PayoutSlipModal
        open={!!slip}
        payout={slip}
        onClose={() => setSlip(null)}
      />
    </div>
  );
}

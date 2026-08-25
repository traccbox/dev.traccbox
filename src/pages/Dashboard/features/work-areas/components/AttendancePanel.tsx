import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useWorkAreaAttendance } from "@/api/geoFencing/hooksGeoFencing";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function AttendancePanel({ workAreaId }: { workAreaId: string }) {
  const [from, setFrom] = useState(isoDaysAgo(14));
  const [to, setTo] = useState(isoDaysAgo(0));

  const invalidRange = from > to;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useWorkAreaAttendance(workAreaId, { from, to }, !invalidRange);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400 mb-3" />}
      </div>

      {invalidRange && (
        <p className="text-sm text-red-600">"From" date must be before "To" date.</p>
      )}

      {!invalidRange && isLoading && (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {!invalidRange && isError && (
        <div className="p-6 text-center border rounded-xl">
          <p className="text-sm text-red-600 mb-2">
            {error instanceof Error ? error.message : "Failed to load attendance."}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-[#1658E5] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {!invalidRange && !isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Check-ins", data.total_check_ins ?? 0],
              ["Check-outs", data.total_check_outs ?? 0],
              ["Avg Hours", data.avg_hours ?? 0],
              [
                "Punctuality",
                `${Math.round((data.punctuality_rate ?? 0) * 100)}%`,
              ],
            ].map(([label, value]) => (
              <div key={label as string} className="border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{value as string}</p>
                <p className="text-[11px] text-gray-500">{label as string}</p>
              </div>
            ))}
          </div>

          {(data.daily ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 border rounded-xl">
              No attendance records for this period.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Check-ins</th>
                    <th className="text-left px-4 py-2 font-medium">Late</th>
                    <th className="text-left px-4 py-2 font-medium">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.daily.map((d) => (
                    <tr key={d.date}>
                      <td className="px-4 py-2">{d.date}</td>
                      <td className="px-4 py-2">{d.check_ins}</td>
                      <td className="px-4 py-2 text-yellow-600">{d.late}</td>
                      <td className="px-4 py-2 text-red-600">{d.absent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

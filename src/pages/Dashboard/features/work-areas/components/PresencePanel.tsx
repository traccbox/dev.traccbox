import { Loader2, RefreshCw } from "lucide-react";
import { useWorkAreaPresence, getApiErrorMessage } from "@/api/geoFencing/hooksGeoFencing";

const STATUS_STYLE: Record<string, string> = {
  inside: "bg-green-100 text-green-700",
  near: "bg-yellow-100 text-yellow-700",
  outside: "bg-red-100 text-red-700",
  offline: "bg-gray-100 text-gray-600",
};

export default function PresencePanel({ workAreaId }: { workAreaId: string }) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useWorkAreaPresence(workAreaId);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center border rounded-xl">
        <p className="text-sm text-red-600 mb-2">
          {getApiErrorMessage(error, "Failed to load presence.")}
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-[#1658E5] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const employees = data?.employees ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Live Presence</h3>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1658E5] hover:underline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          ["Inside", data?.inside ?? 0, "text-green-600"],
          ["Near", data?.near ?? 0, "text-yellow-600"],
          ["Outside", data?.outside ?? 0, "text-red-600"],
          ["Offline", data?.offline ?? 0, "text-gray-500"],
        ].map(([label, value, color]) => (
          <div key={label as string} className="border rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value as number}</p>
            <p className="text-[11px] text-gray-500">{label as string}</p>
          </div>
        ))}
      </div>

      {employees.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 border rounded-xl">
          No presence data available yet.
        </div>
      ) : (
        <div className="border rounded-xl divide-y max-h-72 overflow-y-auto">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-[11px] text-gray-500">
                  {e.last_seen
                    ? `Last seen ${new Date(e.last_seen).toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                  STATUS_STYLE[e.status] ?? STATUS_STYLE.offline
                }`}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

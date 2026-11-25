import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { getLivePositions } from "@/api/travels/apiTravels";
import { TravelFilterValues } from "@/api/travels/types";
import { EmptyState } from "@/components/dashboard/States";

/** Who is moving right now (GET /travel/live), refreshed every 30s. */
const LivePositionsCard: React.FC<{ filters: TravelFilterValues }> = ({
  filters,
}) => {
  const { branch, team } = filters;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["travel-live", branch, team],
    queryFn: () => getLivePositions({ branch, team }),
    refetchInterval: 30_000,
  });

  const ago = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm mb-6">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Live Now</h2>
        <span className="text-xs text-gray-500">
          {data ? `${data.length} active` : ""}
        </span>
      </div>
      {isLoading ? (
        <p className="p-4 text-xs text-gray-500">Loading…</p>
      ) : isError ? (
        <EmptyState title="Failed to load live positions" />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nobody is being tracked right now" />
      ) : (
        <ul className="divide-y divide-gray-50">
          {data.map((p) => (
            <li
              key={p.employee_id || p.employee}
              className="px-4 py-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-medium text-gray-900">{p.employee}</p>
                <p className="text-[10px] text-gray-400">
                  {[p.branch, p.team].filter(Boolean).join(" • ") || "—"}
                </p>
              </div>
              <div className="text-right text-gray-600">
                <p>
                  {p.speed_kmh != null ? `${p.speed_kmh} km/h` : "—"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {ago(p.updated_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LivePositionsCard;

import React, { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getTravelTrend } from "@/api/travels/apiTravels";
import {
  TravelFilterValues,
  TravelGranularity,
} from "@/api/travels/types";
import { EmptyState } from "@/components/dashboard/States";
import Spinner from "@/components/ui/Spinner";

const OPTIONS: { value: TravelGranularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TravelTrendCard: React.FC<{ filters: TravelFilterValues }> = ({
  filters,
}) => {
  const [granularity, setGranularity] = useState<TravelGranularity>("daily");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["travel-trend", granularity, filters],
    queryFn: () => getTravelTrend({ granularity, ...filters }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Distance Trend
          </h2>
          <p className="text-[11px] text-gray-500">
            Total distance travelled (km)
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setGranularity(o.value)}
              className={`px-3 h-8 text-xs font-medium ${
                granularity === o.value
                  ? "bg-[#1658E5] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState title="Failed to load trend" />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No trend data for this period" />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" km" width={60} />
              <Tooltip formatter={(v: number) => [`${v} km`, "Distance"]} />
              <Bar dataKey="distance_km" fill="#1658E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TravelTrendCard;

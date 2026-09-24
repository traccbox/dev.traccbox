import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useWorkAreaViolations, getApiErrorMessage } from "@/api/geoFencing/hooksGeoFencing";
import Pagination from "@/components/dashboard/Pagination";

export default function ViolationsPanel({ workAreaId }: { workAreaId: string }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, error, refetch } = useWorkAreaViolations(
    workAreaId,
    page,
    limit,
  );

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
          {getApiErrorMessage(error, "Failed to load violations.")}
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

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? rows.length;

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">No violations recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-left px-4 py-2 font-medium">When</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 font-medium text-gray-800">
                  {v.employee_name}
                </td>
                <td className="px-4 py-2 capitalize text-gray-600">
                  {String(v.type).replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {v.occurred_at
                    ? new Date(v.occurred_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      v.resolved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {v.resolved ? "Resolved" : "Open"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <Pagination
          page={page}
          pageSize={limit}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

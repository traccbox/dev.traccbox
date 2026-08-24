import { useState } from "react";
import { Loader2, Search, Users, X } from "lucide-react";
import { useAssignableEmployees } from "@/api/geoFencing/hooksGeoFencing";
import { useDebounce } from "@/hooks/useDebounce";
import Pagination from "@/components/dashboard/Pagination";

interface Props {
  open: boolean;
  assignedIds: string[];
  saving?: boolean;
  onClose: () => void;
  onAssign: (ids: string[]) => void;
}

export default function AssignEmployeesModal({
  open,
  assignedIds,
  saving = false,
  onClose,
  onAssign,
}: Props) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [team, setTeam] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const limit = 20;

  const debounced = useDebounce(search, 400);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAssignableEmployees({
      search: debounced.trim() || undefined,
      department: department.trim() || undefined,
      team: team.trim() || undefined,
      page,
      limit,
    });

  if (!open) return null;

  const employees = data?.data ?? [];
  const total = data?.meta?.total ?? employees.length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assign Employees</h2>
            <p className="text-xs text-gray-500">
              Select employees to add to this work area
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name…"
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              placeholder="Department"
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={team}
              onChange={(e) => {
                setTeam(e.target.value);
                setPage(1);
              }}
              placeholder="Team"
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border rounded-xl divide-y max-h-[45vh] overflow-y-auto">
            {isLoading && (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}

            {isError && (
              <div className="p-6 text-center">
                <p className="text-sm text-red-600 mb-2">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load employees."}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-sm font-semibold text-[#1658E5] hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && employees.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No employees found
              </div>
            )}

            {!isError &&
              employees.map((e) => {
                const already = assignedIds.includes(e.id);
                return (
                  <label
                    key={e.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      already ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={already}
                      checked={already || selected.includes(e.id)}
                      onChange={() => toggle(e.id)}
                      className="w-4 h-4 accent-[#1658E5]"
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                      {e.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {[e.role, e.department, e.team].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </div>
                    {already && (
                      <span className="text-[10px] font-semibold text-gray-500">
                        ASSIGNED
                      </span>
                    )}
                  </label>
                );
              })}
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

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <span className="text-xs text-gray-500">
            {selected.length} selected {isFetching && "· loading…"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => onAssign(selected)}
              disabled={selected.length === 0 || saving}
              className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

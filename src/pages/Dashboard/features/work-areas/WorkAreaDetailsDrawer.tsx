import {
  X,
  Edit,
  Copy,
  Power,
  Trash2,
  MapPin,
  Users,
  Clock,
  LucideIcon,
} from "lucide-react";
import { WorkArea, WORK_AREA_TYPE_OPTIONS } from "./types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkAreaById,
  getWorkAreaById,
} from "@/api/geoFencing/apiGeoFencing";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";

interface Props {
  // area: WorkArea | null;
  id: string;
  onClose: () => void;
  // onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  inside: "bg-green-100 text-green-700",
  near: "bg-orange-100 text-orange-700",
  outside: "bg-red-100 text-red-700",
  offline: "bg-gray-100 text-gray-600",
};

export default function WorkAreaDetailsDrawer({
  id,
  onClose,
  onToggle,
}: Props) {
  console.log(id);

  const queryClient = useQueryClient();

  const {
    data: workAreaDetails,
    isLoading: isLoading,
    isError: isError,
    error: detailsError,
  } = useQuery({
    queryKey: ["work-area-details", id],
    queryFn: () => getWorkAreaById(id),
  });

  const { mutate: onDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteWorkAreaById,

    onSuccess: () => {
      toast.success("Work area deleted successfully");

      // Refetch the work areas list
      queryClient.invalidateQueries({
        queryKey: ["work-areas"],
      });

      // Refetch the statistics
      queryClient.invalidateQueries({
        queryKey: ["work-area-stats"],
      });

      // If the details query is cached
      queryClient.invalidateQueries({
        queryKey: ["work-area"],
      });

      onClose();
    },

    onError: (error) => {
      console.error("Failed to delete work area:", error);
      toast.error("Failed to delete work area");
    },
  });

  if (isLoading) {
    return (
      <div className="w-full bg-slate-200 h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Failed to load work area information
          </h2>
          <p className="mt-1 text-sm text-red-600">
            Statistics:{" "}
            {detailsError instanceof Error
              ? detailsError.message
              : "Failed to load work area statistics."}
          </p>
        </div>
      </div>
    );
  }

  const area = workAreaDetails;

  console.log(area);

  const typeLabel =
    WORK_AREA_TYPE_OPTIONS.find((o) => o.value === area.type)?.label ||
    area.type;
  const inside = area.employees.filter((e) => e.status === "inside").length;
  const outside = area.employees.filter(
    (e) => e.status === "outside" || e.status === "near",
  ).length;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">{area.name}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  area.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {area.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {typeLabel} · {area.locations[0].name || "No address"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Edit, label: "Edit", color: "text-blue-600" },
              { icon: Copy, label: "Duplicate", color: "text-purple-600" },
              {
                icon: Power,
                label: area.status === "active" ? "Disable" : "Enable",
                color: "text-orange-600",
                onClick: () => onToggle?.(area.id),
              },
              {
                icon: Trash2,
                label: "Delete",
                id: "delete",
                color: "text-red-600",
                onClick: () => onDelete?.(area.id),
              },
            ].map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                disabled={a.id === "delete" && isDeleting}
                className="flex flex-col items-center gap-1 py-3 border rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                <a.icon className={`w-4 h-4 ${a.color}`} />
                <span className="text-[11px] font-medium text-gray-700">
                  {a.id === "delete"
                    ? isDeleting
                      ? "Deleting"
                      : "Delete"
                    : a.label}
                </span>
              </button>
            ))}
          </div>

          {/* Map */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Map Preview</h4>
            {/* <WorkAreaMap areas={[area]} selectedId={area.id} height={220} /> */}
          </div>

          {/* Today's Attendance */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Today's Attendance</h4>
            <div className="grid grid-cols-3 gap-2">
              <StatMini
                icon={Users}
                value={area.employees.length}
                label="Assigned"
                color="bg-blue-50 text-[#1658E5]"
              />
              <StatMini
                icon={MapPin}
                value={inside}
                label="Inside"
                color="bg-green-50 text-green-600"
              />
              <StatMini
                icon={Clock}
                value={outside}
                label="Outside"
                color="bg-orange-50 text-orange-600"
              />
            </div>
          </div>

          {/* Employees */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Assigned Employees</h4>
            <div className="border rounded-xl divide-y">
              {area.employees.length === 0 && (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No employees assigned
                </div>
              )}
              {area.employees.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {e.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.role}</div>
                  </div>
                  {e.status && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[e.status]}`}
                    >
                      {e.status.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Working rules */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Working Rules</h4>
            <div className="border rounded-xl p-4 grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Days</span>
              <span className="font-medium">
                {area.rules.working_days.join(", ") || "---"}
              </span>
              <span className="text-gray-500">Hours</span>
              <span className="font-medium">
                {area.rules.working_hours.start} –{" "}
                {area.rules.working_hours.end}
              </span>
              <span className="text-gray-500">GPS Accuracy</span>
              <span className="font-medium">{area.rules.gps_accuracy} m</span>
              <span className="text-gray-500">Grace Period</span>
              <span className="font-medium">{area.rules.grace_period} min</span>
              <span className="text-gray-500">Auto Check-In</span>
              <span className="font-medium">
                {area.rules.auto_check_in ? "Yes" : "No"}
              </span>
              <span className="text-gray-500">Violation Alerts</span>
              <span className="font-medium">
                {area.rules.violation_alerts ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatMiniProp = {
  label: string;
  value: string | number;
  color: string;
  icon: LucideIcon;
};

function StatMini({ icon: Icon, value, label, color }: StatMiniProp) {
  return (
    <div className="border rounded-xl p-3 text-center">
      <div
        className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-1`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

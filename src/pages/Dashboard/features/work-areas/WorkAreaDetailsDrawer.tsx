import { useState } from "react";
import {
  X,
  Edit,
  Power,
  Trash2,
  MapPin,
  Users,
  Clock,
  Plus,
  LucideIcon,
  Loader2,
  UserMinus,
  Compass,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { WORK_AREA_TYPE_OPTIONS } from "./types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkAreaById,
  getWorkAreaById,
} from "@/api/geoFencing/apiGeoFencing";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";
import WorkAreaMap from "./WorkAreaMap";
import ConfirmDialog from "./components/ConfirmDialog";
import RulesPanel from "./components/RulesPanel";
import PresencePanel from "./components/PresencePanel";
import AttendancePanel from "./components/AttendancePanel";
import ViolationsPanel from "./components/ViolationsPanel";
import LocationEditorModal from "./components/LocationEditorModal";
import AssignEmployeesModal from "./components/AssignEmployeesModal";
import EditWorkAreaModal from "./components/EditWorkAreaModal";
import {
  getApiErrorMessage,
  useAddLocation,
  useAssignEmployees,
  useDeleteLocation,
  useRemoveEmployee,
  useToggleWorkAreaStatus,
  useUpdateLocation,
  useUpdateWorkArea,
  useCheckGeofence,
} from "@/api/geoFencing/hooksGeoFencing";
import { WorkAreaLocationResponse, WorkAreaEmployee } from "@/api/geoFencing/typesGeoFencing";
import { useLocationTrackingContext } from "@/contexts/LocationTrackingContext";
import { useAuth } from "@/components/auth/AuthProvider";

interface Props {
  id: string;
  onClose: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  inside: "bg-green-100 text-green-700",
  near: "bg-orange-100 text-orange-700",
  outside: "bg-red-100 text-red-700",
  offline: "bg-gray-100 text-gray-600",
};

const TABS = [
  "Overview",
  "Locations",
  "Employees",
  "Rules",
  "Presence",
  "Attendance",
  "Violations",
] as const;

type Tab = (typeof TABS)[number];

export default function WorkAreaDetailsDrawer({ id, onClose }: Props) {
  const queryClient = useQueryClient();
  const { user, staff } = useAuth();
  const { staffLocations } = useLocationTrackingContext();
  const checkGeofenceMutation = useCheckGeofence();
  const companyId = staff?.company_id || user?.id || "";

  const [tab, setTab] = useState<Tab>("Overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [locationModal, setLocationModal] = useState<{
    open: boolean;
    location: WorkAreaLocationResponse | null;
  }>({ open: false, location: null });
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeEmployeeId, setRemoveEmployeeId] = useState<string | null>(null);

  const [checkEmployee, setCheckEmployee] = useState<WorkAreaEmployee | null>(null);
  const [checkLat, setCheckLat] = useState("");
  const [checkLng, setCheckLng] = useState("");
  const [checkAccuracy, setCheckAccuracy] = useState("10");
  const [checkQrCode, setCheckQrCode] = useState("");
  const [checkResult, setCheckResult] = useState<any | null>(null);

  const {
    data: area,
    isLoading,
    isError,
    error: detailsError,
    refetch,
  } = useQuery({
    queryKey: ["work-area-details", id],
    queryFn: () => getWorkAreaById(id),
    enabled: !!id,
  });

  const { mutate: onDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteWorkAreaById,
    onSuccess: () => {
      toast.success("Work area deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["work-areas"] });
      queryClient.invalidateQueries({ queryKey: ["work-area-stats"] });
      onClose();
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to delete work area")),
  });

  const updateArea = useUpdateWorkArea(id);
  const toggleStatus = useToggleWorkAreaStatus(id);
  const addLocation = useAddLocation(id);
  const updateLocation = useUpdateLocation(id);
  const deleteLocation = useDeleteLocation(id);
  const assignEmployees = useAssignEmployees(id);
  const removeEmployee = useRemoveEmployee(id);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[90] flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white w-full max-w-2xl h-full flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !area) {
    return (
      <div className="fixed inset-0 z-[90] flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white w-full max-w-2xl h-full p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-700">
              Failed to load work area
            </h2>
            <p className="mt-1 text-sm text-red-600">
              {detailsError instanceof Error
                ? detailsError.message
                : "Something went wrong."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg bg-[#1658E5] text-white text-sm font-semibold"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel =
    WORK_AREA_TYPE_OPTIONS.find((o) => o.value === area.type)?.label ||
    area.type;
  const employees = area.employees ?? [];
  const locations = area.locations ?? [];
  const inside = employees.filter((e) => e.status === "inside").length;
  const outside = employees.filter(
    (e) => e.status === "outside" || e.status === "near",
  ).length;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 bg-white border-b px-5 pt-4 z-10">
          <div className="flex items-start justify-between">
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
                  {String(area.status).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {typeLabel} · {locations[0]?.name || "No location"}
                {locations[0] && (locations[0].community || locations[0].ward || locations[0].lga || locations[0].state || locations[0].country) && (
                  <span>
                    {" · "}
                    {[locations[0].community, locations[0].ward, locations[0].lga, locations[0].state, locations[0].country]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-4 mt-3 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 text-sm whitespace-nowrap border-b-2 ${
                  tab === t
                    ? "border-[#1658E5] text-[#1658E5] font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {tab === "Overview" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex flex-col items-center gap-1 py-3 border rounded-xl hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-medium text-gray-700">
                    Edit
                  </span>
                </button>
                <button
                  onClick={() =>
                    toggleStatus.mutate(
                      area.status === "active" ? "inactive" : "active",
                    )
                  }
                  disabled={toggleStatus.isPending}
                  className="flex flex-col items-center gap-1 py-3 border rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  {toggleStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  ) : (
                    <Power className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="text-[11px] font-medium text-gray-700">
                    {area.status === "active" ? "Disable" : "Enable"}
                  </span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                  className="flex flex-col items-center gap-1 py-3 border rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="text-[11px] font-medium text-gray-700">
                    {isDeleting ? "Deleting" : "Delete"}
                  </span>
                </button>
              </div>

              {area.description && (
                <p className="text-sm text-gray-600">{area.description}</p>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Map Preview</h4>
                <div className="rounded-xl overflow-hidden border">
                  <WorkAreaMap
                    areas={[
                      {
                        id: area.id,
                        name: area.name,
                        type: area.type,
                        locations: locations.map((l) => ({
                          name: l.name,
                          boundary: l.boundary,
                        })),
                      },
                    ]}
                    selectedId={area.id}
                    height={220}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StatMini
                  icon={Users}
                  value={employees.length}
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
            </>
          )}

          {tab === "Locations" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Locations ({locations.length})
                </h4>
                <button
                  onClick={() => setLocationModal({ open: true, location: null })}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1658E5] hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Location
                </button>
              </div>

              {locations.length === 0 ? (
                <div className="p-8 text-center border rounded-xl">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No locations yet. Add one to define the geofence.
                  </p>
                </div>
              ) : (
                <div className="border rounded-xl divide-y">
                  {locations.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {l.boundary?.kind === "circle"
                            ? `Circle · ${l.boundary.radius}m`
                            : `Polygon · ${l.boundary?.points?.length ?? 0} points`}
                          {l.address ? ` · ${l.address}` : ""}
                        </p>
                        {(l.community || l.ward || l.lga || l.state || l.country) && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {[l.community, l.ward, l.lga, l.state, l.country]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setLocationModal({ open: true, location: l })
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setDeleteLocationId(l.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Employees" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Assigned Employees ({employees.length})
                </h4>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1658E5] hover:underline"
                >
                  <Plus className="w-4 h-4" /> Assign
                </button>
              </div>

              {employees.length === 0 ? (
                <div className="p-8 text-center border rounded-xl">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No employees assigned</p>
                </div>
              ) : (
                <div className="border rounded-xl divide-y">
                  {employees.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                        {e.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {e.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {[e.role, e.department, e.team]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </div>
                      </div>
                      {e.status && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            STATUS_STYLE[e.status] ?? STATUS_STYLE.offline
                          }`}
                        >
                          {e.status.toUpperCase()}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setCheckEmployee(e);
                          const loc = staffLocations[e.id];
                          setCheckLat(loc ? loc.latitude.toString() : "");
                          setCheckLng(loc ? loc.longitude.toString() : "");
                          setCheckAccuracy("10");
                          setCheckQrCode("");
                          setCheckResult(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
                        title="Check Geofence"
                      >
                        <Compass className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRemoveEmployeeId(e.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Remove from work area"
                      >
                        <UserMinus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Rules" && (
            <RulesPanel workAreaId={id} fallback={area.rules} />
          )}
          {tab === "Presence" && <PresencePanel workAreaId={id} />}
          {tab === "Attendance" && <AttendancePanel workAreaId={id} />}
          {tab === "Violations" && <ViolationsPanel workAreaId={id} />}
        </div>
      </div>

      <EditWorkAreaModal
        open={editOpen}
        saving={updateArea.isPending}
        initial={{
          name: area.name,
          description: area.description,
          type: area.type,
          status: area.status === "inactive" ? "inactive" : "active",
        }}
        onClose={() => setEditOpen(false)}
        onSave={(data) =>
          updateArea.mutate(data, { onSuccess: () => setEditOpen(false) })
        }
      />

      {locationModal.open && (
        <LocationEditorModal
          open
          location={locationModal.location}
          saving={addLocation.isPending || updateLocation.isPending}
          onClose={() => setLocationModal({ open: false, location: null })}
          onSave={(payload) => {
            const done = {
              onSuccess: () => setLocationModal({ open: false, location: null }),
            };
            if (locationModal.location?.id) {
              updateLocation.mutate(
                { locationId: locationModal.location.id, data: payload },
                done,
              );
            } else {
              addLocation.mutate(payload, done);
            }
          }}
        />
      )}

      <AssignEmployeesModal
        open={assignOpen}
        assignedIds={employees.map((e) => e.id)}
        saving={assignEmployees.isPending}
        onClose={() => setAssignOpen(false)}
        onAssign={(ids) =>
          assignEmployees.mutate(ids, { onSuccess: () => setAssignOpen(false) })
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete work area"
        message={`"${area.name}" and its geofence configuration will be permanently removed.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => onDelete(area.id)}
      />

      <ConfirmDialog
        open={!!deleteLocationId}
        title="Remove location"
        message="This location and its boundary will be removed from the work area."
        confirmLabel="Remove"
        loading={deleteLocation.isPending}
        onCancel={() => setDeleteLocationId(null)}
        onConfirm={() =>
          deleteLocationId &&
          deleteLocation.mutate(deleteLocationId, {
            onSuccess: () => setDeleteLocationId(null),
          })
        }
      />

      <ConfirmDialog
        open={!!removeEmployeeId}
        title="Remove employee"
        message="This employee will no longer be assigned to this work area."
        confirmLabel="Remove"
        loading={removeEmployee.isPending}
        onCancel={() => setRemoveEmployeeId(null)}
        onConfirm={() =>
          removeEmployeeId &&
          removeEmployee.mutate(removeEmployeeId, {
            onSuccess: () => setRemoveEmployeeId(null),
          })
        }
      />

      {checkEmployee && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                Check Geofence: {checkEmployee.name}
              </h3>
              <button
                onClick={() => setCheckEmployee(null)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={checkLat}
                  onChange={(e) => setCheckLat(e.target.value)}
                  placeholder="e.g. 6.6018"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={checkLng}
                  onChange={(e) => setCheckLng(e.target.value)}
                  placeholder="e.g. 3.3515"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Accuracy (meters)
                </label>
                <input
                  type="number"
                  value={checkAccuracy}
                  onChange={(e) => setCheckAccuracy(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  QR Code (Optional)
                </label>
                <input
                  type="text"
                  value={checkQrCode}
                  onChange={(e) => setCheckQrCode(e.target.value)}
                  placeholder="QR Code payload"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {checkResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                checkResult.inside
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {checkResult.inside ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  Status: {checkResult.inside ? "Inside Geofence" : "Outside Geofence"}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>Can Clock In:</div>
                  <div className="font-semibold">{checkResult.can_clock_in ? "Yes" : "No"}</div>
                  {checkResult.distance_from_edge !== undefined && checkResult.distance_from_edge !== null && (
                    <>
                      <div>Distance:</div>
                      <div className="font-semibold">{checkResult.distance_from_edge.toFixed(1)}m from boundary</div>
                    </>
                  )}
                  {checkResult.work_area_id && (
                    <>
                      <div>Work Area ID:</div>
                      <div className="font-mono truncate">{checkResult.work_area_id}</div>
                    </>
                  )}
                </div>
                {checkResult.reason && (
                  <p className="mt-1 pt-1 border-t border-current/10 font-medium">
                    Reason: {checkResult.reason}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCheckEmployee(null)}
                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700"
              >
                Close
              </button>
              <button
                disabled={checkGeofenceMutation.isPending || !checkLat || !checkLng}
                onClick={() => {
                  const latNum = parseFloat(checkLat);
                  const lngNum = parseFloat(checkLng);
                  const accNum = parseFloat(checkAccuracy) || 0;
                  if (isNaN(latNum) || isNaN(lngNum)) {
                    toast.error("Please enter a valid latitude and longitude.");
                    return;
                  }
                  checkGeofenceMutation.mutate(
                    {
                      employee_id: checkEmployee.id,
                      lat: latNum,
                      lng: lngNum,
                      accuracy: accNum,
                      company_id: companyId,
                      qr_code: checkQrCode,
                    },
                    {
                      onSuccess: (data) => {
                        setCheckResult(data);
                        toast.success("Geofence check succeeded!");
                      },
                      onError: () => {
                        setCheckResult(null);
                      }
                    }
                  );
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                {checkGeofenceMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Run Check
              </button>
            </div>
          </div>
        </div>
      )}
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

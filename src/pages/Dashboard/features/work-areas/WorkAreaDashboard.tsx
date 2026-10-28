import { useState } from "react";
import {
  ArrowLeft,
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
  X,
  ShieldCheck,
  CalendarDays,
  FileWarning,
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
  inside: "bg-green-100 text-green-700 border border-green-200",
  near: "bg-orange-100 text-orange-700 border border-orange-200",
  outside: "bg-red-100 text-red-700 border border-red-200",
  offline: "bg-gray-100 text-gray-600 border border-gray-200",
};

export default function WorkAreaDashboard({ id, onClose }: Props) {
  const queryClient = useQueryClient();
  const { user, staff } = useAuth();
  const { staffLocations } = useLocationTrackingContext();
  const checkGeofenceMutation = useCheckGeofence();
  const companyId = staff?.company_id || user?.id || "";

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
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !area) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 max-w-2xl mx-auto">
          <h2 className="font-semibold text-red-700 text-lg">
            Failed to load work area dashboard
          </h2>
          <p className="mt-1 text-sm text-red-600">
            {getApiErrorMessage(detailsError, "Something went wrong.")}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-[#1658E5] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50 transition-colors"
            >
              Back to List
            </button>
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
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <button
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Work Areas list
      </button>

      {/* Main Header / Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{area.name}</h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                area.status === "active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {String(area.status).toUpperCase()}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {typeLabel}
            </span>
          </div>
          {area.description && (
            <p className="text-sm text-gray-500 max-w-3xl">{area.description}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            Edit Info
          </button>
          <button
            onClick={() =>
              toggleStatus.mutate(
                area.status === "active" ? "inactive" : "active",
              )
            }
            disabled={toggleStatus.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            {toggleStatus.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
            ) : (
              <Power className="w-3.5 h-3.5 text-orange-600" />
            )}
            {area.status === "active" ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-100 hover:border-red-200 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Deleting" : "Delete Area"}
          </button>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (col-span-2) for wider cards (Overview, Rules, Attendance, Violations) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Overview & Map */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              Overview & Geofence Preview
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <StatMini
                icon={Users}
                value={employees.length}
                label="Assigned Staff"
                color="bg-blue-50 text-[#1658E5] border border-blue-100"
              />
              <StatMini
                icon={CheckCircle2}
                value={inside}
                label="Staff Inside"
                color="bg-green-50 text-green-600 border border-green-100"
              />
              <StatMini
                icon={Clock}
                value={outside}
                label="Staff Outside"
                color="bg-orange-50 text-orange-600 border border-orange-100"
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-150">
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
                height={280}
              />
            </div>
          </div>

          {/* Card 4: Rules Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Rules Configuration
            </h3>
            <RulesPanel workAreaId={id} fallback={area.rules} />
          </div>

          {/* Card 6: Attendance Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              Attendance History
            </h3>
            <AttendancePanel workAreaId={id} />
          </div>

          {/* Card 7: Violations Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <FileWarning className="w-4 h-4 text-rose-600" />
              Violations Log
            </h3>
            <ViolationsPanel workAreaId={id} />
          </div>
        </div>

        {/* Right Column (col-span-1) for list cards (Locations, Employees, Presence) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 2: Locations List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Locations ({locations.length})
              </h3>
              <button
                onClick={() => setLocationModal({ open: true, location: null })}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1658E5] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Location
              </button>
            </div>

            {locations.length === 0 ? (
              <div className="p-6 text-center border rounded-xl border-dashed">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500">
                  No locations yet. Add a location zone.
                </p>
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-80 overflow-y-auto">
                {locations.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2.5 px-3.5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{l.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {l.boundary?.kind === "circle"
                          ? `Circle zone · ${l.boundary.radius}m`
                          : l.boundary?.kind === "polygon"
                            ? `Polygon zone · ${l.boundary.points.length} pts`
                            : l.boundary?.kind === "multipolygon"
                              ? `Multipolygon zone · ${l.boundary.rings.length} rings`
                              : "Zone"}
                      </p>
                      {(l.community || l.ward || l.lga || l.state || l.country) && (
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">
                          {[l.community, l.ward, l.lga, l.state, l.country]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() =>
                          setLocationModal({ open: true, location: l })
                        }
                        className="p-1 hover:bg-slate-100 rounded-md text-blue-600 cursor-pointer"
                        title="Edit Location"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteLocationId(l.id)}
                        className="p-1 hover:bg-slate-100 rounded-md text-red-600 cursor-pointer"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Employees List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                Employees ({employees.length})
              </h3>
              <button
                onClick={() => setAssignOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1658E5] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Employees
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="p-6 text-center border rounded-xl border-dashed">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500">No employees assigned yet.</p>
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-80 overflow-y-auto">
                {employees.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {e.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {e.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {[e.role, e.department].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    {e.status && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          STATUS_STYLE[e.status] ?? STATUS_STYLE.offline
                        }`}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    )}
                    <div className="flex items-center">
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
                        className="p-1 hover:bg-slate-100 rounded-md text-blue-600 cursor-pointer"
                        title="Check Geofence status"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRemoveEmployeeId(e.id)}
                        className="p-1 hover:bg-slate-100 rounded-md text-red-600 cursor-pointer"
                        title="Remove Employee"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 5: Presence Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Clock className="w-4 h-4 text-orange-600" />
              Presence Tracker
            </h3>
            <PresencePanel workAreaId={id} />
          </div>
        </div>
      </div>

      {/* Modals & Confirmation Dialogs */}
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

      {/* Geofence Validator Drawer Modal */}
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
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
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
                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700 cursor-pointer"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
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

interface StatMiniProp {
  label: string;
  value: string | number;
  color: string;
  icon: LucideIcon;
}

function StatMini({ icon: Icon, value, label, color }: StatMiniProp) {
  return (
    <div className={`rounded-xl p-3.5 text-center ${color} shadow-sm transition-all hover:scale-[1.02]`}>
      <div
        className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center mx-auto mb-1.5"
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase font-bold tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}

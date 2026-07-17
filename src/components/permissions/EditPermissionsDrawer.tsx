import React, { useEffect, useMemo, useState } from "react";
import { X, RotateCcw, Save, Shield, Loader2 } from "lucide-react";
import PermissionsEditor from "./PermissionsEditor";
import {
  usePermissionsSchema,
  useStaffPermissions,
  useUpdateStaffPermissions,
  useResetStaffPermissions,
  useRoleDefaults,
} from "@/api/permissions/hooks";
import {
  PermissionsMap,
  diffPermissions,
  emptyFromSchema,
  mergePermissions,
} from "@/api/permissions";
import { useToast } from "@/hooks/use-toast";

interface Staff {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  staff: Staff | null;
}

const ROLE_OPTIONS = ["admin", "manager", "hr", "sales", "view", "custom"];

export default function EditPermissionsDrawer({
  open,
  onClose,
  companyId,
  staff,
}: Props) {
  const { toast } = useToast();
  const schemaQ = usePermissionsSchema();
  const staffQ = useStaffPermissions(
    open ? companyId : undefined,
    open ? staff?.id : undefined,
  );
  const updateMut = useUpdateStaffPermissions(companyId, staff?.id || "");
  const resetMut = useResetStaffPermissions(companyId, staff?.id || "");

  const [role, setRole] = useState<string>("");
  const [resetRole, setResetRole] = useState<string>("");
  const defaultsQ = useRoleDefaults(resetRole || undefined);

  const [draft, setDraft] = useState<PermissionsMap>({});
  const [baseline, setBaseline] = useState<PermissionsMap>({});

  // hydrate from server whenever new data arrives / drawer opens
  useEffect(() => {
    if (!open || !schemaQ.data || !staffQ.data) return;
    const skeleton = emptyFromSchema(schemaQ.data, false);
    const merged = mergePermissions(skeleton, staffQ.data.permissions || {});
    setDraft(merged);
    setBaseline(merged);
    setRole(staffQ.data.role || staff?.role || "");
    setResetRole("");
  }, [open, schemaQ.data, staffQ.data, staff?.role]);

  // when user picks a "reset to role" option and defaults arrive, preview them
  useEffect(() => {
    if (!resetRole || !defaultsQ.data || !schemaQ.data) return;
    const skeleton = emptyFromSchema(schemaQ.data, false);
    setDraft(mergePermissions(skeleton, defaultsQ.data));
  }, [defaultsQ.data, resetRole, schemaQ.data]);

  const patch = useMemo(
    () => diffPermissions(baseline, draft),
    [baseline, draft],
  );
  const isDirty = Object.keys(patch).length > 0 || (!!resetRole && resetRole !== role);

  const handleSave = async () => {
    if (!staff) return;
    try {
      if (resetRole && resetRole !== role) {
        // Role change → hit the reset endpoint with the new role
        await resetMut.mutateAsync({ role: resetRole });
        toast({ title: "Role reset", description: `Permissions reset to ${resetRole} defaults.` });
      } else if (Object.keys(patch).length) {
        await updateMut.mutateAsync({ permissions: patch });
        toast({ title: "Permissions updated", description: `Saved changes for ${staff.full_name || staff.email}.` });
      }
      onClose();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.detail || e?.message || "Something went wrong",
      });
    }
  };

  const handleReset = async () => {
    if (!staff) return;
    try {
      await resetMut.mutateAsync(resetRole ? { role: resetRole } : {});
      toast({ title: "Reset", description: "Permissions restored to role defaults." });
      onClose();
    } catch (e: any) {
      toast({
        title: "Reset failed",
        description: e?.response?.data?.detail || e?.message || "Something went wrong",
      });
    }
  };

  if (!open || !staff) return null;

  const loading = schemaQ.isLoading || staffQ.isLoading;
  const saving = updateMut.isPending || resetMut.isPending;

  return (
    <div className="fixed inset-0 z-[95] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Permissions</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {staff.full_name || staff.email} · Current role:{" "}
                <span className="font-medium text-purple-700">{role || "—"}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reset-to-role picker */}
        <div className="px-5 py-3 border-b bg-gray-50">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Reset to role defaults (optional)
          </label>
          <div className="flex gap-2">
            <select
              value={resetRole}
              onChange={(e) => setResetRole(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— Keep current permissions —</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            {resetRole && (
              <button
                type="button"
                onClick={() => setResetRole("")}
                className="px-3 py-2 text-xs border rounded-lg hover:bg-white"
              >
                Undo
              </button>
            )}
          </div>
          {resetRole && (
            <p className="text-[11px] text-purple-700 mt-1.5">
              Previewing {resetRole} defaults — save to apply.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading permissions…
            </div>
          ) : schemaQ.isError ? (
            <div className="text-sm text-red-600">Failed to load permissions schema.</div>
          ) : (
            <PermissionsEditor
              schema={schemaQ.data || {}}
              value={draft}
              onChange={setDraft}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save changes
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

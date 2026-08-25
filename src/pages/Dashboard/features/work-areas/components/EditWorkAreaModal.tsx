import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { WORK_AREA_TYPE_OPTIONS } from "../types";
import { UpdateWorkAreaPayload } from "@/api/geoFencing/typesGeoFencing";

interface Props {
  open: boolean;
  initial: {
    name: string;
    description?: string;
    type: string;
    status: "active" | "inactive";
  };
  saving?: boolean;
  onClose: () => void;
  onSave: (data: UpdateWorkAreaPayload) => void;
}

export default function EditWorkAreaModal({
  open,
  initial,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [type, setType] = useState(initial.type ?? "office");
  const [status, setStatus] = useState<"active" | "inactive">(
    initial.status ?? "active",
  );
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const error = !name.trim() ? "Work area name is required." : null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Edit Work Area</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
              >
                {WORK_AREA_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "inactive")
                }
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {touched && error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setTouched(true);
              if (error) return;
              onSave({
                name: name.trim(),
                description: description.trim(),
                type,
                status,
              });
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  useUpdateRules,
  useWorkAreaRules,
} from "@/api/geoFencing/hooksGeoFencing";
import { WorkAreaRules } from "@/api/geoFencing/typesGeoFencing";
import { RULE_OPTIONS } from "@/utils/workArea";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  workAreaId: string;
  fallback?: WorkAreaRules;
}

export default function RulesPanel({ workAreaId, fallback }: Props) {
  const { data, isLoading, isError, error, refetch } =
    useWorkAreaRules(workAreaId);
  const { mutate: save, isPending } = useUpdateRules(workAreaId);

  const [draft, setDraft] = useState<WorkAreaRules | undefined>(fallback);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  if (isLoading && !draft) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError && !draft) {
    return (
      <div className="p-6 text-center border rounded-xl">
        <p className="text-sm text-red-600 mb-2">
          {error instanceof Error ? error.message : "Failed to load rules."}
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

  if (!draft) return null;

  const update = (updates: Partial<WorkAreaRules>) =>
    setDraft({ ...draft, ...updates });

  const invalidHours =
    !!draft.working_hours?.start &&
    !!draft.working_hours?.end &&
    draft.working_hours.start >= draft.working_hours.end;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Working Days</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((d) => {
            const active = draft.working_days?.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  update({
                    working_days: active
                      ? draft.working_days.filter((x) => x !== d)
                      : [...(draft.working_days || []), d],
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-sm border-2 ${
                  active
                    ? "border-[#1658E5] bg-blue-50 text-[#1658E5] font-semibold"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Start Time</label>
          <input
            type="time"
            value={draft.working_hours?.start ?? ""}
            onChange={(e) =>
              update({
                working_hours: {
                  ...draft.working_hours,
                  start: e.target.value,
                },
              })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">End Time</label>
          <input
            type="time"
            value={draft.working_hours?.end ?? ""}
            onChange={(e) =>
              update({
                working_hours: { ...draft.working_hours, end: e.target.value },
              })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            GPS Accuracy (m)
          </label>
          <input
            type="number"
            min={1}
            value={draft.gps_accuracy ?? 0}
            onChange={(e) => update({ gps_accuracy: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Grace Period (min)
          </label>
          <input
            type="number"
            min={0}
            value={draft.grace_period ?? 0}
            onChange={(e) => update({ grace_period: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        {RULE_OPTIONS.map(([k, label]) => (
          <label
            key={k}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm text-gray-700">{label}</span>
            <input
              type="checkbox"
              checked={Boolean(draft[k])}
              onChange={(e) => update({ [k]: e.target.checked } as Partial<WorkAreaRules>)}
              className="w-4 h-4 accent-[#1658E5]"
            />
          </label>
        ))}
      </div>

      {invalidHours && (
        <p className="text-sm text-red-600">
          End time must be later than start time.
        </p>
      )}

      <button
        onClick={() => save(draft)}
        disabled={isPending || invalidHours}
        className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Rules
      </button>
    </div>
  );
}

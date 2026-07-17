import React from "react";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import {
  PermissionsMap,
  PermissionsSchema,
  humanize,
} from "@/api/permissions";

interface Props {
  schema: PermissionsSchema;
  value: PermissionsMap;
  onChange: (next: PermissionsMap) => void;
  disabled?: boolean;
  /** When true, hide the toggle for admin-only actions etc. Reserved. */
  compact?: boolean;
}

/**
 * Renders module → action toggles from a permissions schema.
 * Fully data-driven — no hardcoded module or action names.
 */
export default function PermissionsEditor({
  schema,
  value,
  onChange,
  disabled,
  compact,
}: Props) {
  const modules = Object.keys(schema || {});

  const toggle = (mod: string, action: string, next: boolean) => {
    onChange({
      ...value,
      [mod]: { ...(value[mod] || {}), [action]: next },
    });
  };

  const setAllInModule = (mod: string, next: boolean) => {
    const actions = schema[mod] || [];
    const nextActions: Record<string, boolean> = {};
    actions.forEach((a) => (nextActions[a] = next));
    onChange({ ...value, [mod]: nextActions });
  };

  if (!modules.length) {
    return (
      <div className="text-sm text-gray-500 py-6 text-center">
        No permissions schema available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {modules.map((mod) => {
        const actions = schema[mod] || [];
        const allOn = actions.every((a) => value[mod]?.[a]);
        return (
          <div key={mod}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-700" />
                {humanize(mod)}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => setAllInModule(mod, !allOn)}
                  className="text-[11px] text-purple-700 hover:underline font-medium"
                >
                  {allOn ? "Disable all" : "Enable all"}
                </button>
              )}
            </div>
            <div className={compact ? "grid grid-cols-1 gap-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2"}>
              {actions.map((action) => {
                const checked = !!value[mod]?.[action];
                return (
                  <div
                    key={action}
                    className="flex items-center justify-between w-full py-1"
                  >
                    <span className="text-sm text-gray-700">
                      {humanize(action)}
                    </span>
                    <Switch
                      checked={checked}
                      onCheckedChange={(v) => toggle(mod, action, !!v)}
                      disabled={disabled}
                      className="data-[state=checked]:bg-purple-700 data-[state=unchecked]:bg-gray-200"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

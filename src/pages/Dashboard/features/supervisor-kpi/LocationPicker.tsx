import React, { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import type { WorkLocation } from "@/api/supervisor-kpi/types";
import { useLocationOptions } from "./useWorkAreas";
import { Pill, inputCls, lower, useTerms } from "./ui";

/** Multi-select over work areas, with a shortcut to create a new one. */
const LocationPicker: React.FC<{
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate: () => void;
  /** Hide locations already in the workspace (used by "add existing"). */
  othersOnly?: boolean;
}> = ({ selected, onChange, onCreate, othersOnly }) => {
  const T = useTerms();
  const { mine, others, isLoading, isError, retry, canCreate } = useLocationOptions();
  const [q, setQ] = useState("");
  const match = (l: WorkLocation) => `${l.name} ${l.address ?? ""}`.toLowerCase().includes(q.toLowerCase());
  const groups: [string, WorkLocation[]][] = [
    ["In this workspace", othersOnly ? [] : mine.filter(match)],
    [othersOnly ? "Your work areas" : "Other work areas", others.filter(match)],
  ];
  const total = (othersOnly ? 0 : mine.length) + others.length;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-100 p-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder={`Search ${lower(T.locations)}`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {canCreate && (
          <button type="button" onClick={onCreate} className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-[#1658E5] hover:bg-blue-50">
            <Plus className="h-4 w-4" /> New {lower(T.location)}
          </button>
        )}
      </div>

      <div className="max-h-56 overflow-y-auto">
        {groups.map(([title, list]) =>
          list.length === 0 ? null : (
            <div key={title}>
              <div className="bg-gray-50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">{title}</div>
              {list.map((l) => {
                const on = selected.includes(l.id);
                return (
                  <button key={l.id} type="button" onClick={() => toggle(l.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blue-50/40">
                    <span className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${on ? "border-[#1658E5] bg-[#1658E5] text-white" : "border-gray-300"}`}>{on && <Check className="h-3 w-3" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-gray-800">{l.name}</span>
                      {(l.address || l.geofenceRadius) && <span className="block truncate text-xs text-gray-400">{[l.address, l.geofenceRadius ? `${Math.round(l.geofenceRadius)} m geofence` : ""].filter(Boolean).join(" · ")}</span>}
                    </span>
                    {l.source === "local" && <Pill>Sample</Pill>}
                  </button>
                );
              })}
            </div>
          ),
        )}
        {isLoading && <p className="px-3 py-3 text-xs text-gray-400">Loading work areas…</p>}
        {isError && (
          <p className="px-3 py-3 text-xs text-red-600">Couldn’t load work areas. <button type="button" onClick={retry} className="font-semibold underline">Try again</button></p>
        )}
        {!isLoading && !isError && total === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-500">{othersOnly ? "Every work area is already in this workspace." : "No work areas yet."}{canCreate ? ` Use “New ${lower(T.location)}” to create one.` : " Ask an admin to create one."}</p>
        )}
        {total > 0 && groups.every(([, l]) => l.length === 0) && <p className="px-3 py-3 text-xs text-gray-400">Nothing matches “{q}”.</p>}
      </div>
    </div>
  );
};

export default LocationPicker;

import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPreset } from "@/api/supervisor-kpi/presets";
import { useWorkforce } from "./store";
import { Avatar, BASE } from "./ui";

/** Always visible: which business you're looking at, and how to change it. */
const WorkspaceSwitcher: React.FC = () => {
  const { id, name, config, workspaces, switchWorkspace } = useWorkforce();
  const nav = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100">
        <Avatar name={name} />
        <span className="min-w-0">
          <span className="block max-w-[200px] truncate text-sm font-semibold text-gray-900">{name}</span>
          <span className="block max-w-[200px] truncate text-[11px] text-gray-500">{getPreset(config.industry).label}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-gray-500">Switch workspace</DropdownMenuLabel>
        <div className="max-h-72 overflow-y-auto">
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              className="gap-3"
              onSelect={() => {
                if (w.id === id) return;
                nav(BASE);
                switchWorkspace(w.id);
              }}
            >
              <Avatar name={w.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{w.name}</span>
                <span className="block truncate text-[11px] text-gray-500">{getPreset(w.config.industry).label}</span>
              </span>
              {w.id === id && <Check className="h-4 w-4 text-[#1658E5]" />}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onSelect={() => nav(`${BASE}/workspaces/new`)}><Plus className="h-4 w-4" /> Add another industry</DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onSelect={() => nav(`${BASE}/workspaces`)}><LayoutGrid className="h-4 w-4" /> View all workspaces</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;

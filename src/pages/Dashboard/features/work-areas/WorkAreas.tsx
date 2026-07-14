import React, { useMemo, useState } from "react";
import {
  Plus, Search, MapPinned, CheckCircle2, Users, Edit, Trash2, Maximize2, Layers, Building2,
} from "lucide-react";
import { WorkArea, WORK_AREA_TYPE_OPTIONS, WorkAreaType, WorkAreaStatus } from "./types";
import { MOCK_WORK_AREAS } from "./mockData";
import WorkAreaMap from "./WorkAreaMap";
import CreateWorkAreaWizard from "./CreateWorkAreaWizard";
import WorkAreaDetailsDrawer from "./WorkAreaDetailsDrawer";

const TYPE_DOT: Record<string, string> = {
  office: "bg-blue-500",
  sales_territory: "bg-purple-500",
  warehouse: "bg-amber-500",
  service_zone: "bg-emerald-500",
  delivery_zone: "bg-pink-500",
  client_location: "bg-cyan-500",
  construction_site: "bg-red-500",
  market: "bg-teal-500",
  custom: "bg-indigo-500",
};

export default function WorkAreas() {
  const [areas, setAreas] = useState<WorkArea[]>(MOCK_WORK_AREAS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkAreaStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | WorkAreaType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mapSearch, setMapSearch] = useState("");

  const filtered = useMemo(() => areas.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q) ||
        a.state?.toLowerCase().includes(q) ||
        a.lga?.toLowerCase().includes(q) ||
        a.employees.some((e) => e.name.toLowerCase().includes(q));
    }
    return true;
  }), [areas, search, statusFilter, typeFilter]);

  const totalEmployees = areas.reduce((sum, a) => sum + a.employees.length, 0);
  const activeCount = areas.filter((a) => a.status === "active").length;

  const detailsArea = detailsId ? areas.find((a) => a.id === detailsId) || null : null;

  const handleDelete = (id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (detailsId === id) setDetailsId(null);
  };
  const handleToggle = (id: string) => {
    setAreas((prev) => prev.map((a) => a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a));
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Areas</h1>
          <p className="text-sm text-gray-500">Create and manage virtual work locations for your teams</p>
        </div>
        <button onClick={() => setWizardOpen(true)}
          className="inline-flex items-center gap-2 bg-[#1658E5] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl">
          <Plus className="w-4 h-4" /> Create Work Area
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work areas, employees, state, LGA…"
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          {WORK_AREA_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={MapPinned} label="Total Work Areas" value={areas.length} tint="from-blue-500 to-blue-700" />
        <StatCard icon={CheckCircle2} label="Active Work Areas" value={activeCount} tint="from-emerald-500 to-emerald-700" />
        <StatCard icon={Users} label="Assigned Employees" value={totalEmployees} tint="from-purple-500 to-purple-700" />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: list */}
        <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Work Area List</h3>
            <span className="text-xs text-gray-500">{filtered.length} of {areas.length}</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No work areas found
              </div>
            )}
            {filtered.map((a) => (
              <div key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`group px-4 py-3 cursor-pointer transition-colors ${
                  selectedId === a.id ? "bg-blue-50 border-l-4 border-[#1658E5]" : "hover:bg-gray-50 border-l-4 border-transparent"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${TYPE_DOT[a.type] || "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{a.name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{a.address || "No address"}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {a.employees.length}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>{WORK_AREA_TYPE_OPTIONS.find((o) => o.value === a.type)?.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setDetailsId(a.id); }}
                      className="p-1.5 hover:bg-blue-100 rounded-md text-blue-600" title="View / Edit">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                      className="p-1.5 hover:bg-red-100 rounded-md text-red-600" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: map */}
        <div className={`lg:col-span-3 bg-white border rounded-2xl overflow-hidden ${fullscreen ? "fixed inset-4 z-[80] col-span-full" : ""}`}>
          <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={mapSearch} onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search location on map…"
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setSatellite(!satellite)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium ${satellite ? "bg-blue-50 text-[#1658E5] border-blue-200" : "text-gray-600"}`}>
              <Layers className="w-3.5 h-3.5" /> {satellite ? "Satellite" : "Map"}
            </button>
            <button onClick={() => setFullscreen(!fullscreen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Maximize2 className="w-3.5 h-3.5" /> {fullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
          <WorkAreaMap
            areas={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            satellite={satellite}
            height={fullscreen ? "calc(100vh - 140px)" : 560}
          />
        </div>
      </div>

      <CreateWorkAreaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={(wa) => setAreas((prev) => [wa, ...prev])}
      />
      <WorkAreaDetailsDrawer
        area={detailsArea}
        onClose={() => setDetailsId(null)}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: any) {
  return (
    <div className="relative overflow-hidden bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${tint} opacity-10`} />
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

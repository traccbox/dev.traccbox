import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Compass,
  Plus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useSites, useWorkers } from "@/api/payout/hooks";
import CreateSiteModal from "./CreateSiteModal";
import WorkAreaMap from "../../work-areas/WorkAreaMap";

export default function SiteGeofenceSetup() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const { data: sitesData, isLoading } = useSites();
  const { data: workersData } = useWorkers();

  const sites = sitesData?.data || [];
  const workers = workersData?.data || [];

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const mapAreas = sites.map((s) => ({
    id: s.id,
    name: s.name,
    type: "construction_site",
    boundary: {
      kind: "circle" as const,
      center: [s.latitude, s.longitude] as [number, number],
      radius: s.geofence_radius || 100,
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Construction Sites & Geofences</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure site boundaries, latitude, longitude, and geofence verification radius.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Construction Site</span>
        </button>
      </div>

      {/* Grid Dashboard: Left Site List, Right Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sites List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Active Work Sites ({sites.length})
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading sites...</div>
            ) : sites.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed rounded-xl">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No sites registered yet</p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Create Site
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 hide-scrollbar">
                {sites.map((s) => {
                  const siteWorkers = workers.filter((w) => w.site_id === s.id);
                  const isSelected = selectedSite?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSiteId(s.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                          {s.project && (
                            <p className="text-[11px] text-slate-500 font-medium">{s.project}</p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {s.geofence_radius}m radius
                        </span>
                      </div>

                      {s.address && (
                        <p className="text-[10px] text-slate-500 mt-2 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-slate-150/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>
                          GPS: {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1 font-sans font-bold text-slate-700">
                          <Users className="w-3 h-3 text-slate-400" />
                          {siteWorkers.length} Workers
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map Preview & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive Geofence Map: {selectedSite?.name || "Site Map"}
                </h3>
              </div>
              {selectedSite && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Boundary Verified
                </span>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <WorkAreaMap
                areas={mapAreas}
                selectedId={selectedSite?.id}
                onSelect={(id) => setSelectedSiteId(id)}
                height={380}
              />
            </div>

            {selectedSite && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Latitude</span>
                  <span className="font-mono font-bold text-slate-900">{selectedSite.latitude}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Longitude</span>
                  <span className="font-mono font-bold text-slate-900">{selectedSite.longitude}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Geofence Radius</span>
                  <span className="font-bold text-blue-700">{selectedSite.geofence_radius} Meters</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Verification Rule</span>
                  <span className="font-bold text-emerald-700">Strict GPS Radius</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateSiteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

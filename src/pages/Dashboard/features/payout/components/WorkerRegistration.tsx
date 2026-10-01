import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Building2,
  Phone,
  Banknote,
  Clock,
  UserCheck,
} from "lucide-react";
import { useSites, useWorkers } from "@/api/payout/hooks";
import RegisterWorkerModal from "./RegisterWorkerModal";

export default function WorkerRegistration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const { data: sitesData } = useSites();
  const sites = sitesData?.data || [];

  const { data: workersData, isLoading } = useWorkers({
    search: searchQuery || undefined,
    site_id: selectedSiteId || undefined,
  });

  const workers = workersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Same-Day Worker Registration</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Register daily site workers immediately before work starts with assigned site and daily wage contract.
          </p>
        </div>

        <button
          onClick={() => setRegisterModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Worker Today</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workers by name, ID, phone, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
        >
          <option value="">All Assigned Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Workers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading daily workers...</div>
        ) : workers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No workers registered for this view</p>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer inline-block"
            >
              Register Worker Today
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Worker ID & Name</th>
                  <th className="py-3.5 px-4">Role / Trade</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Assigned Site</th>
                  <th className="py-3.5 px-4">Daily Wage Rate</th>
                  <th className="py-3.5 px-4">Standard Hours</th>
                  <th className="py-3.5 px-4">Registration Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((w) => {
                  const siteName =
                    typeof w.site === "object" ? w.site?.name : sites.find((s) => s.id === w.site_id)?.name || "Site";

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-[10px] font-mono text-blue-600 font-semibold">{w.id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {w.role || "Labourer"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {w.phone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {siteName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          ₦{(w.daily_wage || 7000).toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          ₦{Math.round(((w.daily_wage || 7000) / (w.standard_hours || 8)) * 100) / 100}/hr
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {w.standard_hours || 8} Hours
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          Active Today
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegisterWorkerModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </div>
  );
}

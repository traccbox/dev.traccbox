import React, { useState } from "react";
import { X, UserPlus, Building2, Banknote, Clock, Loader2 } from "lucide-react";
import { useRegisterWorker, useSites } from "@/api/payout/hooks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const COMMON_ROLES = [
  "Mason",
  "Labourer",
  "Carpenter",
  "Steel Fixer",
  "Electrician",
  "Plumber",
  "Site Supervisor",
  "Equipment Operator",
  "Painter",
];

export default function RegisterWorkerModal({ open, onClose }: Props) {
  const registerWorkerMutation = useRegisterWorker();
  const { data: sitesData } = useSites();
  const sites = sitesData?.data || [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Mason");
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [dailyWage, setDailyWage] = useState("7000");
  const [standardHours, setStandardHours] = useState("8");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Worker Name and Phone number are required");
      return;
    }
    const selectedSite = siteId || sites[0]?.id;
    if (!selectedSite) {
      toast.error("Please create or select a construction site first");
      return;
    }

    registerWorkerMutation.mutate(
      {
        name,
        phone,
        role,
        site_id: selectedSite,
        daily_wage: parseFloat(dailyWage) || 7000,
        standard_hours: parseFloat(standardHours) || 8,
      },
      {
        onSuccess: () => {
          onClose();
          setName("");
          setPhone("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base tracking-wide">Same-Day Worker Registration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Worker Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Musa Ibrahim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +234 803 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Role / Trade Title
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
              >
                {COMMON_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Site *
              </label>
              <select
                value={siteId || sites[0]?.id || ""}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                Daily Wage Rate (₦) *
              </label>
              <input
                type="number"
                required
                placeholder="7000"
                value={dailyWage}
                onChange={(e) => setDailyWage(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Standard Work Hours *
              </label>
              <input
                type="number"
                required
                placeholder="8"
                value={standardHours}
                onChange={(e) => setStandardHours(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900">
            <strong>Hourly rate calculation rule:</strong> ₦
            {dailyWage && standardHours
              ? Math.round((parseFloat(dailyWage) / parseFloat(standardHours)) * 100) / 100
              : 875}
            /hour. Partial days will be prorated automatically upon clock-out.
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerWorkerMutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {registerWorkerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Register Worker Today
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

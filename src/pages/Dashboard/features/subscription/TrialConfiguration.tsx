import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShieldAlert, Sparkles, Save } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { CardsSkeleton, ErrorState } from "@/components/dashboard/States";
import { fetchTrialConfig, saveTrialConfig, TrialConfig } from "@/api/mock/subscription";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const Toggle: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label, hint, checked, onChange,
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-xs font-medium text-gray-800">{label}</p>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#1658E5]" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  </div>
);

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[11px] font-medium text-gray-600">{label}</label>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

const TrialConfiguration: React.FC = () => {
  const { user, isStaff } = useAuth();
  const { toast } = useToast();
  const [cfg, setCfg] = useState<TrialConfig | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trial-config"],
    queryFn: fetchTrialConfig,
  });

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (c: TrialConfig) => saveTrialConfig(c),
    onSuccess: () => toast({ title: "Trial configuration saved" }),
  });

  const role = String((user as { role?: string } | null)?.role ?? "").toLowerCase();
  const isSuperAdmin = !isStaff || role === "super_admin" || role === "superadmin" || role === "admin";

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Admin only</h2>
        <p className="text-gray-500 max-w-sm">Trial plan configuration can only be managed by a Super Admin.</p>
      </div>
    );
  }

  const set = <K extends keyof TrialConfig>(k: K, v: TrialConfig[K]) =>
    setCfg((c) => (c ? { ...c, [k]: v } : c));

  return (
    <div>
      <PageHeader
        title="Trial Plan Configuration"
        description="Define what companies get during their free trial."
        crumbs={[{ label: "Subscription" }, { label: "Trial Configuration" }]}
        actions={
          <button
            onClick={() => cfg && mutation.mutate(cfg)}
            disabled={!cfg || mutation.isPending}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd] disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !cfg ? (
        <CardsSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Trial Limits</h3>
              <Toggle label="Enable Trial" hint="Allow new companies to start a free trial" checked={cfg.enableTrial} onChange={(v) => set("enableTrial", v)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                <NumberField label="Trial Duration (days)" value={cfg.trialDurationDays} onChange={(v) => set("trialDurationDays", v)} />
                <NumberField label="Maximum Employees" value={cfg.maxEmployees} onChange={(v) => set("maxEmployees", v)} />
                <NumberField label="Maximum Branches" value={cfg.maxBranches} onChange={(v) => set("maxBranches", v)} />
                <NumberField label="Maximum Teams" value={cfg.maxTeams} onChange={(v) => set("maxTeams", v)} />
                <NumberField label="Max Daily Check-ins" value={cfg.maxDailyCheckIns} onChange={(v) => set("maxDailyCheckIns", v)} />
                <NumberField label="Reminder Days Before Expiry" value={cfg.reminderDaysBefore} onChange={(v) => set("reminderDaysBefore", v)} />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Feature Access</h3>
              <Toggle label="Enable GPS" checked={cfg.enableGPS} onChange={(v) => set("enableGPS", v)} />
              <Toggle label="Enable Reports" checked={cfg.enableReports} onChange={(v) => set("enableReports", v)} />
              <Toggle label="Enable Geofencing" checked={cfg.enableGeofencing} onChange={(v) => set("enableGeofencing", v)} />
              <Toggle label="Enable Route Tracking" checked={cfg.enableRouteTracking} onChange={(v) => set("enableRouteTracking", v)} />
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Lifecycle Automation</h3>
              <Toggle label="Auto-expire Trial" checked={cfg.autoExpireTrial} onChange={(v) => set("autoExpireTrial", v)} />
              <Toggle label="Send Reminder Before Expiry" checked={cfg.sendReminderBeforeExpiry} onChange={(v) => set("sendReminderBeforeExpiry", v)} />
              <Toggle label="Auto Disable Company" checked={cfg.autoDisableCompany} onChange={(v) => set("autoDisableCompany", v)} />
              <Toggle label="Convert Trial to Paid" checked={cfg.convertTrialToPaid} onChange={(v) => set("convertTrialToPaid", v)} />
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-2xl border border-gray-100 shadow-sm p-5 h-fit text-white" style={{ background: "linear-gradient(135deg,#1658E5 0%,#0F3E9E 100%)" }}>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15">
              <Sparkles className="w-3 h-3" /> Live Preview
            </span>
            <h3 className="text-xl font-bold mt-3">{cfg.enableTrial ? `${cfg.trialDurationDays}-Day Free Trial` : "Trial Disabled"}</h3>
            <p className="text-xs opacity-80 mt-1">What new companies will receive</p>
            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex justify-between"><span className="opacity-80">Employees</span><b>{cfg.maxEmployees}</b></li>
              <li className="flex justify-between"><span className="opacity-80">Branches</span><b>{cfg.maxBranches}</b></li>
              <li className="flex justify-between"><span className="opacity-80">Teams</span><b>{cfg.maxTeams}</b></li>
              <li className="flex justify-between"><span className="opacity-80">Daily check-ins</span><b>{cfg.maxDailyCheckIns}</b></li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                ["GPS", cfg.enableGPS],
                ["Reports", cfg.enableReports],
                ["Geofencing", cfg.enableGeofencing],
                ["Route Tracking", cfg.enableRouteTracking],
              ].map(([l, on]) => (
                <span key={String(l)} className={`text-[10px] px-2 py-1 rounded-full ${on ? "bg-white/20" : "bg-white/5 line-through opacity-60"}`}>
                  {String(l)}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] opacity-80">
              {cfg.autoExpireTrial ? "Trial auto-expires" : "Manual expiry"} •{" "}
              {cfg.sendReminderBeforeExpiry ? `Reminder ${cfg.reminderDaysBefore} days before` : "No reminder"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialConfiguration;

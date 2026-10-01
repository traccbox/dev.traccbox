import React, { useState } from "react";
import {
  Banknote,
  Building2,
  Users,
  Clock,
  Smartphone,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import DailyPayoutBoard from "./components/DailyPayoutBoard";
import SiteGeofenceSetup from "./components/SiteGeofenceSetup";
import WorkerRegistration from "./components/WorkerRegistration";
import DailyAttendanceBoard from "./components/DailyAttendanceBoard";
import WorkerClockInPortal from "./components/WorkerClockInPortal";

export type PayoutTab = "board" | "sites" | "workers" | "attendance" | "clockin";

interface Props {
  initialTab?: PayoutTab;
}

export default function PayoutDashboard({ initialTab = "board" }: Props) {
  const [activeTab, setActiveTab] = useState<PayoutTab>(initialTab);

  const tabs = [
    { id: "board", label: "Payout Dashboard", icon: Banknote },
    { id: "sites", label: "Site & Geofences", icon: Building2 },
    { id: "workers", label: "Register Workers", icon: Users },
    { id: "attendance", label: "Attendance Logs", icon: Clock },
    { id: "clockin", label: "Worker Clock-In Portal", icon: Smartphone },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Daily Worker Attendance & Payout
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                TraccBOX Geofenced Attendance Engine & Daily Wage Proration Module
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 border border-slate-200/60">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Geofence Active</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PayoutTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === "board" && <DailyPayoutBoard />}
        {activeTab === "sites" && <SiteGeofenceSetup />}
        {activeTab === "workers" && <WorkerRegistration />}
        {activeTab === "attendance" && <DailyAttendanceBoard />}
        {activeTab === "clockin" && <WorkerClockInPortal />}
      </div>
    </div>
  );
}

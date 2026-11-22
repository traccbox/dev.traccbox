import React, { useState } from "react";
import {
  Banknote,
  Building2,
  Users,
  Clock,
  Smartphone,
  ShieldCheck,
  Calendar,
  FileText,
} from "lucide-react";
import DailyPayoutBoard from "./components/DailyPayoutBoard";
import PaySlipDashboard from "./components/PaySlipDashboard";
import SiteGeofenceSetup from "./components/SiteGeofenceSetup";
import WorkerRegistration from "./components/WorkerRegistration";
import DailyAttendanceBoard from "./components/DailyAttendanceBoard";
import WorkerClockInPortal from "./components/WorkerClockInPortal";

export type PayoutTab =
  | "board"
  | "payslip"
  | "sites"
  | "workers"
  | "attendance"
  | "clockin";

interface Props {
  initialTab?: PayoutTab;
}

export default function PayoutDashboard({ initialTab = "board" }: Props) {
  const [activeTab, setActiveTab] = useState<PayoutTab>(initialTab);

  const tabs = [
    { id: "board",      label: "Payout Board",         icon: Banknote   },
    { id: "payslip",    label: "Pay Slip & Disbursal",  icon: FileText   },
    { id: "sites",      label: "Sites & Geofences",     icon: Building2  },
    { id: "workers",    label: "Register Workers",       icon: Users      },
    { id: "attendance", label: "Attendance Logs",        icon: Clock      },
    { id: "clockin",    label: "Clock-In Portal",        icon: Smartphone },
  ] as const;

  return (
    <div className="space-y-4 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200/80 p-4 md:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shrink-0">
            <Banknote className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Daily Worker Attendance &amp; Payout
            </h1>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              TraccBOX Geofenced Attendance Engine &amp; Daily Wage Proration Module
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Geofence Active</span>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PayoutTab)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[11px] md:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Contents ── */}
      <div className="mt-2">
        {activeTab === "board"      && <DailyPayoutBoard />}
        {activeTab === "payslip"    && <PaySlipDashboard />}
        {activeTab === "sites"      && <SiteGeofenceSetup />}
        {activeTab === "workers"    && <WorkerRegistration />}
        {activeTab === "attendance" && <DailyAttendanceBoard />}
        {activeTab === "clockin"    && <WorkerClockInPortal />}
      </div>
    </div>
  );
}

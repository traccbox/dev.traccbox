import React, { useState } from "react";
import {
  Smartphone,
  MapPin,
  Compass,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  FileText,
  User,
  Building2,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  calculateHaversineDistance,
  useClockIn,
  useClockOut,
  useDailyAttendance,
  useSites,
  useWorkers,
} from "@/api/payout/hooks";
import { toast } from "sonner";
import PayoutSlipModal from "./PayoutSlipModal";
import type { DailyAttendance, DailyPayout } from "@/api/payout/types";

export default function WorkerClockInPortal() {
  const { data: workersData } = useWorkers();
  const { data: sitesData } = useSites();

  const workers = workersData?.data || [];
  const sites = sitesData?.data || [];

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || "TB-0001");
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || "site-001");

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: attData, refetch: refetchAttendance } = useDailyAttendance(
    selectedWorkerId,
    todayStr
  );

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  // GPS state
  const [userLat, setUserLat] = useState<number>(6.6018);
  const [userLng, setUserLng] = useState<number>(3.3515);
  const [capturingGps, setCapturingGps] = useState(false);
  const [previewSlipPayout, setPreviewSlipPayout] = useState<DailyPayout | null>(null);

  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const distanceToSiteCenter = currentSite
    ? calculateHaversineDistance(userLat, userLng, currentSite.latitude, currentSite.longitude)
    : 0;
  const isInsideGeofence = distanceToSiteCenter <= (currentSite?.geofence_radius || 100);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setCapturingGps(false);
        toast.success("Current GPS location acquired!");
      },
      (err) => {
        setCapturingGps(false);
        toast.error(`GPS Error: ${err.message}. Using active site coordinates for demo.`);
        if (currentSite) {
          setUserLat(currentSite.latitude);
          setUserLng(currentSite.longitude);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSimulateClockIn = () => {
    if (!currentWorker || !currentSite) {
      toast.error("Worker and site must be selected");
      return;
    }

    clockInMutation.mutate(
      {
        workerId: currentWorker.id,
        siteId: currentSite.id,
        location: { latitude: userLat, longitude: userLng },
      },
      {
        onSuccess: () => refetchAttendance(),
      }
    );
  };

  const handleSimulateClockOut = () => {
    if (!currentWorker || !currentSite) {
      toast.error("Worker and site must be selected");
      return;
    }

    clockOutMutation.mutate(
      {
        workerId: currentWorker.id,
        siteId: currentSite.id,
        location: { latitude: userLat, longitude: userLng },
      },
      {
        onSuccess: (data) => {
          refetchAttendance();
          // Generate quick preview payout slip
          const hours = data.hours_worked || 7.58;
          const wage = currentWorker.daily_wage || 7000;
          const rate = Math.round((wage / (currentWorker.standard_hours || 8)) * 100) / 100;
          const amount = hours >= 8 ? wage : Math.round(rate * hours);

          setPreviewSlipPayout({
            id: `pay-${Date.now()}`,
            worker_id: currentWorker.id,
            worker_name: currentWorker.name,
            worker: currentWorker,
            site_id: currentSite.id,
            site_name: currentSite.name,
            date: todayStr,
            daily_wage: wage,
            hourly_rate: rate,
            hours_worked: hours,
            amount,
            status: "pending",
            reference: `TB-PAY-${todayStr.replace(/-/g, "")}-9921`,
            attendance: data,
          });
        },
      }
    );
  };

  const hasClockedIn = attData?.clock_in_status === "verified" || attData?.status === "clocked_in";
  const hasClockedOut = attData?.status === "completed" || !!attData?.hours_worked;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Worker Clock-In & Attendance Portal</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate or execute daily worker attendance, geofence verification, and instant payout slip generation.
          </p>
        </div>

        <button
          onClick={handleCaptureGPS}
          disabled={capturingGps}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          {capturingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4 text-blue-400" />}
          <span>Acquire Device GPS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mobile Mockup Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl border-4 border-slate-800 space-y-5">
            {/* Device Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  TB
                </div>
                <span className="text-xs font-bold tracking-wide">TraccBOX Mobile</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                GPS LIVE
              </span>
            </div>

            {/* Worker Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Active Worker
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role}) — {w.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Construction Site
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  const s = sites.find((st) => st.id === e.target.value);
                  if (s) {
                    setUserLat(s.latitude);
                    setUserLng(s.longitude);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.geofence_radius}m radius)
                  </option>
                ))}
              </select>
            </div>

            {/* Geofence Status Badge */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isInsideGeofence
                  ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
                  : "bg-rose-950/40 border-rose-700/60 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {isInsideGeofence ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <span>{isInsideGeofence ? "Inside Geofence Boundary" : "Outside Site Boundary"}</span>
              </div>
              <div className="text-[11px] opacity-90 flex justify-between">
                <span>Distance to center:</span>
                <span className="font-mono font-bold">{distanceToSiteCenter} meters</span>
              </div>
              <div className="text-[10px] opacity-75 font-mono">
                Device Lat/Lng: {userLat.toFixed(4)}, {userLng.toFixed(4)}
              </div>
            </div>

            {/* Simulated GPS Adjusters */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Simulate Location Testing
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentSite) {
                      setUserLat(currentSite.latitude);
                      setUserLng(currentSite.longitude);
                      toast.info("Moved device location inside site boundary.");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 rounded-xl text-[10px] font-bold text-center cursor-pointer"
                >
                  Inside Site (0m)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentSite) {
                      setUserLat(currentSite.latitude + 0.005);
                      setUserLng(currentSite.longitude + 0.005);
                      toast.warning("Moved device location outside site boundary.");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-xl text-[10px] font-bold text-center cursor-pointer"
                >
                  Outside Site (+500m)
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-3">
              <button
                onClick={handleSimulateClockIn}
                disabled={clockInMutation.isPending || hasClockedIn}
                className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  hasClockedIn
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40"
                }`}
              >
                {clockInMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>{hasClockedIn ? "Clock-In Verified (Active)" : "Clock In Now"}</span>
              </button>

              <button
                onClick={handleSimulateClockOut}
                disabled={clockOutMutation.isPending || !hasClockedIn || hasClockedOut}
                className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  hasClockedOut || !hasClockedIn
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40"
                }`}
              >
                {clockOutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{hasClockedOut ? "Clock-Out Completed" : "Clock Out & Calculate Pay"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Worker Summary & Today's Earnings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Today's Worker Attendance Overview
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentWorker?.name} (ID: {currentWorker?.id}) · {currentWorker?.role}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Daily Wage: ₦{(currentWorker?.daily_wage || 7000).toLocaleString()}
              </span>
            </div>

            {/* Attendance Status Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    1. Clock-In Status
                  </span>
                  {hasClockedIn ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      VERIFIED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full">
                      PENDING
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {attData?.clock_in_time || "Not Clocked In"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Server timestamp recorded with GPS boundary check
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    2. Clock-Out Status
                  </span>
                  {hasClockedOut ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full">
                      PENDING
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {attData?.clock_out_time || "Not Clocked Out"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Calculates working duration & hourly proration
                </div>
              </div>
            </div>

            {/* Calculated Pay Preview Box */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Today's System Calculated Earnings
                </span>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold rounded-lg">
                  PRORATION ACTIVE
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-black text-white">
                    ₦
                    {hasClockedOut
                      ? previewSlipPayout?.amount.toLocaleString() || "6,632"
                      : "0"}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Calculated for {attData?.hours_worked || 7.58} approved hours worked today
                  </span>
                </div>

                {previewSlipPayout && (
                  <button
                    onClick={() => setPreviewSlipPayout(previewSlipPayout)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Digital Slip</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PayoutSlipModal
        open={!!previewSlipPayout}
        payout={previewSlipPayout}
        onClose={() => setPreviewSlipPayout(null)}
      />
    </div>
  );
}

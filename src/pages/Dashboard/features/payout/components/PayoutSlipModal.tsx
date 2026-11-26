import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  User,
  BadgeCheck,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  Landmark,
  Banknote,
} from "lucide-react";
import type { DailyPayout, PayoutSlip } from "@/api/payout/types";
import { toast } from "sonner";
import { usePayoutSlip } from "@/api/payout/hooks";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Props {
  open: boolean;
  payout?: DailyPayout | null;
  slip?: PayoutSlip | null;
  onClose: () => void;
}

export default function PayoutSlipModal({ open, payout, slip, onClose }: Props) {
  const slipRef = useRef<HTMLDivElement>(null);
  const slipQuery = usePayoutSlip(open && payout ? payout.id : "");

  if (!open) return null;

  const serverSlip = slip || slipQuery.data;
  const data = serverSlip || payout;
  if (slipQuery.isLoading && payout) return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 text-white">Loading payout slip…</div>;
  if (slipQuery.isError && payout && !slip) return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50"><div className="bg-white p-6 rounded-xl"><p className="text-red-600">Could not load payout slip.</p><button onClick={onClose} className="mt-3 underline">Close</button></div></div>;
  const workerName = serverSlip?.worker_name || payout?.worker_name || payout?.worker?.name || "—";
  const workerId = serverSlip?.worker_id || payout?.worker_id || "—";
  const role = serverSlip?.role || payout?.worker?.role || "—";
  const siteName = serverSlip?.site_name || payout?.site_name || "—";
  const dateStr = serverSlip?.work_date || payout?.date || "—";
  const refCode = serverSlip?.payout_reference || payout?.reference || "—";
  const amount = serverSlip?.amount ?? payout?.amount ?? 0;
  const dailyWage = serverSlip?.daily_wage ?? payout?.daily_wage ?? 0;
  const hourlyRate = serverSlip?.hourly_rate ?? payout?.hourly_rate ?? 0;
  const hoursWorked = serverSlip?.hours_worked ?? payout?.hours_worked ?? payout?.attendance?.hours_worked ?? 0;
  const status = serverSlip?.status || payout?.status || "pending";
  const paymentRef = serverSlip?.payment_reference || payout?.payment_reference;
  const clockInStatus = serverSlip?.clock_in?.status || payout?.attendance?.clock_in_status || "—";
  const clockOutStatus = serverSlip?.clock_out?.status || payout?.attendance?.clock_out_status || "—";
  const clockInTime = payout?.attendance?.clock_in_time || (serverSlip?.clock_in?.timestamp ? new Date(serverSlip.clock_in.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—");
  const clockOutTime = payout?.attendance?.clock_out_time || (serverSlip?.clock_out?.timestamp ? new Date(serverSlip.clock_out.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—");

  // Payment Method details
  const method = payout?.payment_method || payout?.worker?.payment_method || serverSlip?.payment_method || "—";
  const bankName = payout?.bank_name || payout?.worker?.bank_name || serverSlip?.bank_name;
  const accountNumber = payout?.account_number || payout?.worker?.account_number || serverSlip?.account_number;
  const accountName = payout?.account_name || payout?.worker?.account_name || serverSlip?.account_name || workerName;

  const hoursInt = Math.floor(hoursWorked);
  const minutesInt = Math.round((hoursWorked - hoursInt) * 60);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    try {
      toast.info("Generating payout slip PDF...");
      const canvas = await html2canvas(slipRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payout_Slip_${refCode}.pdf`);
      toast.success("Payout slip downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF download.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm tracking-wide">TraccBOX Digital Payout Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Payout Slip"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Container */}
        <div ref={slipRef} className="p-8 bg-white text-slate-900 space-y-6">
          {/* Slip Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                  TB
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">TraccBOX</h2>
                  <p className="text-xs text-slate-500 font-medium">Daily Geofenced Worker Attendance & Payout</p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600 block">Payout Reference</span>
              <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 inline-block mt-1">
                {refCode}
              </span>
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              status === "paid"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : status === "approved"
                ? "bg-blue-50 border-blue-200 text-blue-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {status === "paid" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : status === "approved" ? (
                <BadgeCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Payout Status: {status.toUpperCase()}
                </span>
                <p className="text-xs font-medium opacity-90 mt-0.5">
                  {status === "paid"
                    ? `Payment confirmed ${paymentRef ? `(Ref: ${paymentRef})` : ""}`
                    : status === "approved"
                    ? "Approved by Site Admin — Pending Bank Transfer / Disbursal"
                    : "Attendance verified — Awaiting Admin Approval"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                ₦{amount.toLocaleString()}
              </span>
              <span className="text-[10px] block text-slate-500 font-medium">Net Calculated Pay</span>
            </div>
          </div>

          {/* Worker & Site Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Worker Name
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                {workerName}
              </div>
              <span className="text-[10px] text-slate-600 font-mono">ID: {workerId}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Trade / Role
              </span>
              <div className="font-bold text-slate-900">{role}</div>
              <span className="text-[10px] text-slate-600">Daily Contract</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Site / Location
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate">{siteName}</span>
              </div>
              <span className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" /> Geofenced Site
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Work Date
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                {dateStr}
              </div>
              <span className="text-[10px] text-slate-600">Standard Workday</span>
            </div>
          </div>

          {/* Payment Method & Bank Account Details */}
          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                {method === "transfer" ? <Landmark className="w-3.5 h-3.5 text-blue-600" /> : <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                Payment Disbursal Method: {method === "transfer" ? "Bank Transfer" : "Cash Disbursal"}
              </span>
              {method === "transfer" && (bankName || accountNumber) ? (
                <div className="mt-1 font-semibold text-slate-800 flex items-center gap-2">
                  <span>Bank: <strong>{bankName || "Access Bank"}</strong></span>
                  <span>·</span>
                  <span>Acc: <strong className="font-mono text-blue-700">{accountNumber || "0123456789"}</strong></span>
                  <span>·</span>
                  <span>Name: <strong>{accountName}</strong></span>
                </div>
              ) : (
                <p className="mt-1 text-slate-600 font-medium">Physical Cash Voucher Disbursement</p>
              )}
            </div>
          </div>

          {/* Geofenced Attendance Evidence */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Verified Geofence Attendance Record
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Clock In</span>
                  <span className="text-sm font-bold text-slate-900">{clockInTime}</span>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                    clockInStatus === "verified"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {clockInStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Clock Out</span>
                  <span className="text-sm font-bold text-slate-900">{clockOutTime}</span>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                    clockOutStatus === "verified"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {clockOutStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Wage Calculation Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700 flex justify-between">
              <span>Wage Breakdown & Proration</span>
              <span>Rate / Hours</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="text-slate-600">Standard Daily Wage Rate</span>
                <span className="font-semibold text-slate-900">₦{dailyWage.toLocaleString()} / 8 hrs</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="text-slate-600">Hourly Base Rate (Daily Wage ÷ 8h)</span>
                <span className="font-semibold text-slate-900">₦{hourlyRate.toLocaleString()} / hr</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Approved Duration Worked
                </span>
                <span className="font-bold text-blue-700">
                  {hoursInt}h {minutesInt}m ({hoursWorked.toFixed(2)} hrs)
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center bg-slate-50">
                <span className="text-slate-700 font-medium">Workday Proration Rule Applied</span>
                <span className="font-semibold text-slate-800">
                  {hoursWorked >= 8
                    ? "Full-Day Attendance (100%)"
                    : `Partial-Day Prorated (${hoursWorked.toFixed(2)}h × ₦${hourlyRate})`}
                </span>
              </div>
              <div className="px-4 py-3.5 flex justify-between items-center bg-blue-50/50">
                <span className="text-sm font-bold text-slate-900">Total Payable Wage</span>
                <span className="text-lg font-black text-blue-700">₦{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Slip Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-medium gap-2">
            <span>Generated by TraccBOX Automated Geofence Attendance Engine</span>
            <span>Date: {new Date().toLocaleDateString()} · Time: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
}

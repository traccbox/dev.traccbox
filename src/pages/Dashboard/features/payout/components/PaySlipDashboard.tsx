import React, { useState, useRef } from "react";
import {
  FileText,
  Download,
  Printer,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Landmark,
  Banknote,
  Filter,
  CreditCard,
  Building2,
  FileSpreadsheet,
  BadgeCheck,
  RefreshCw,
  Eye,
} from "lucide-react";
import { usePayouts, useMarkPayoutPaid, usePayoutSummary, useExportPayouts } from "@/api/payout/hooks";
import type { DailyPayout } from "@/api/payout/types";
import PayoutSlipModal from "./PayoutSlipModal";
import MarkPaidModal from "./MarkPaidModal";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SitePicker from "./SitePicker";

export default function PaySlipDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Date Filtering Presets & Custom Range
  const [quickDatePreset, setQuickDatePreset] = useState<string>("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [activeSlipPayout, setActiveSlipPayout] = useState<DailyPayout | null>(null);
  const [markPaidPayout, setMarkPaidPayout] = useState<DailyPayout | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);


  const dateRange = (() => {
    if (customDate) return { from: customDate, to: customDate };
    if (fromDate || toDate) return { from: fromDate || undefined, to: toDate || undefined };
    if (quickDatePreset === "all") return {};
    const since = new Date();
    since.setMonth(since.getMonth() - Number(quickDatePreset));
    return { from: since.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
  })();

  const { data: payoutsData, isLoading, isError, refetch } = usePayouts({
    search: searchQuery || undefined,
    site_id: selectedSiteId || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    ...dateRange,
  });
  const { data: summary, isError: summaryError } = usePayoutSummary({ site_id: selectedSiteId || undefined, status: statusFilter === "all" ? undefined : statusFilter, ...dateRange });
  const exportMutation = useExportPayouts();

  const rawPayouts = payoutsData?.data || [];

  const payouts = rawPayouts;

  // Calculate Metrics
  const totalRecords = summary?.total?.count ?? payoutsData?.total ?? payouts.length;
  const totalAmountPaid = summary?.paid?.amount ?? 0;
  const totalAmountApproved = (summary?.approved?.amount ?? 0) + totalAmountPaid;
  const pendingDisbursalCount = summary?.approved?.count ?? 0;
  const paidCount = summary?.paid?.count ?? 0;

  // Export Batch Release CSV / Excel
  const handleExportCSV = async () => {
    try {
      const blob = await exportMutation.mutateAsync({ ...dateRange, status: statusFilter === "all" ? undefined : statusFilter, site_id: selectedSiteId || undefined });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `TraccBOX_Payouts_${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
      toast.success("Payout CSV exported.");
    } catch { toast.error("Payout CSV export failed."); }
  };

  // Export Batch PDF Summary
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    try {
      toast.info("Generating Batch Payslip Summary PDF...");
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Batch_Payslips_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF download.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Company Pay Release
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₦{totalAmountApproved.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Approved & Paid across {totalRecords} records
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Amount Disbursed
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₦{totalAmountPaid.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Confirmed payments ({paidCount} staff)
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Disbursals
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {pendingDisbursalCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Approved Payslips Awaiting Manual Pay
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Payslips
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {totalRecords}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Recorded in selected timeframe
          </div>
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search & Site Filter */}
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff name, ID, bank, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <SitePicker value={selectedSiteId} onChange={setSelectedSiteId} allLabel="All Work Areas" className="px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800" />
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{exportMutation.isPending ? "Exporting…" : "Export CSV"}</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Batch PDF</span>
            </button>
          </div>
        </div>

        {/* Date Presets & Custom Range Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
              Timeframe:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "1", label: "1 Month" },
              { id: "2", label: "2 Months" },
              { id: "3", label: "3 Months" },
              { id: "4", label: "4 Months" },
              { id: "6", label: "6 Months" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setQuickDatePreset(p.id);
                  setCustomDate("");
                  setFromDate("");
                  setToDate("");
                }}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  quickDatePreset === p.id && !customDate && !fromDate
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date & Date Range Pickers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCustomDate("");
                }}
                className="px-2.5 py-1 bg-slate-50 border rounded-lg text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCustomDate("");
                }}
                className="px-2.5 py-1 bg-slate-50 border rounded-lg text-xs font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pay Slips & Batch Release Table */}
      <div ref={tableRef} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payslip records...</div>
        ) : isError || summaryError ? <div className="p-12 text-center text-red-600">Unable to load payout records or summary. Check access and refresh.</div> : payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No payslips found</p>
            <p className="text-xs text-slate-400">
              Approve worker payouts from the Payout Dashboard tab to generate disbursal payslips.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Payout Ref & Staff</th>
                  <th className="py-3.5 px-4">Work Area Site</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Bank / Account Details</th>
                  <th className="py-3.5 px-4">Calculated Amount</th>
                  <th className="py-3.5 px-4">Disbursal Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => {
                  const workerName = p.worker_name || p.worker?.name || "Staff Member";
                  const method = p.payment_method || p.worker?.payment_method || "transfer";
                  const bank = p.bank_name || p.worker?.bank_name;
                  const accNum = p.account_number || p.worker?.account_number;
                  const accName = p.account_name || p.worker?.account_name;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-700">{p.reference}</div>
                        <div className="font-bold text-slate-900 mt-0.5">{workerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.worker_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {p.site_name || "Work Area"}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            method === "transfer"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {method === "transfer" ? <Landmark className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                          {method === "transfer" ? "Bank Transfer" : "Cash Pay"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {method === "transfer" && (bank || accNum) ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Landmark className="w-3.5 h-3.5 text-slate-400" />
                              {bank || "Bank"}
                            </div>
                            <div className="text-[11px] font-mono font-bold text-blue-600">
                              {accNum || "—"}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate max-w-[140px]">
                              {accName || workerName}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium text-slate-500">
                            Cash Voucher Disbursal
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-slate-900">
                          ₦{p.amount?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.hours_worked || 8} hrs approved
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            p.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.status === "approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {p.status === "paid" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : p.status === "approved" ? (
                            <BadgeCheck className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {p.status === "paid" ? "Paid" : p.status === "approved" ? "Approved for Pay" : "Pending"}
                        </span>
                        {p.payment_reference && (
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            Ref: {p.payment_reference}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "approved" && (
                            <button
                              onClick={() => setMarkPaidPayout(p)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Mark as Paid"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Mark Paid</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveSlipPayout(p)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium cursor-pointer"
                            title="View Individual Slip"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Viewer Modal */}
      <PayoutSlipModal
        open={!!activeSlipPayout}
        payout={activeSlipPayout}
        onClose={() => setActiveSlipPayout(null)}
      />

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={!!markPaidPayout}
        payout={markPaidPayout}
        onClose={() => setMarkPaidPayout(null)}
      />
    </div>
  );
}

import React, { useState } from "react";
import {
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  BadgeCheck,
  CreditCard,
  Plus,
  RefreshCw,
  Eye,
  Calculator,
} from "lucide-react";
import {
  useApprovePayout,
  useCalculatePayout,
  usePayouts,
  usePayoutSummary,
  useWorkers,
} from "@/api/payout/hooks";
import type { DailyPayout } from "@/api/payout/types";
import PayoutSlipModal from "./PayoutSlipModal";
import MarkPaidModal from "./MarkPaidModal";
import RegisterWorkerModal from "./RegisterWorkerModal";
import { toast } from "sonner";
import SitePicker from "./SitePicker";

export default function DailyPayoutBoard() {
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [activeSlipPayout, setActiveSlipPayout] = useState<DailyPayout | null>(null);
  const [markPaidPayout, setMarkPaidPayout] = useState<DailyPayout | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);


  const {
    data: payoutsData,
    isLoading,
    isError,
    refetch,
  } = usePayouts({
    site_id: selectedSiteId || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    date: dateFilter || undefined,
  });

  const payouts = payoutsData?.data || [];
  const { data: summary } = usePayoutSummary({ date: dateFilter, site_id: selectedSiteId || undefined });
  const approvePayoutMutation = useApprovePayout();
  const calculatePayoutMutation = useCalculatePayout();

  // Summary Metrics
  const totalPayable = summary?.total?.amount ?? payouts.reduce((acc, p) => acc + (p.amount || 0), 0);
  const pendingCount = summary?.pending?.count ?? 0;
  const approvedCount = summary?.approved?.count ?? 0;
  const paidCount = summary?.paid?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Daily Pay
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₦{totalPayable.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {payouts.length} workers on board
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Review
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {pendingCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Awaiting Admin Approval
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Approved Payouts
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {approvedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Ready for Disbursal
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Paid / Disbursed
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {paidCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Payment Confirmed
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by worker name, ID, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Site Filter */}
            <SitePicker value={selectedSiteId} onChange={setSelectedSiteId} className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800" />

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Worker Today</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 border-t pt-3 border-slate-100 overflow-x-auto hide-scrollbar">
          {["all", "pending", "approved", "paid"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "All Payouts" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Loading payout transactions...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-600">Unable to load payout records. Refresh or check your access.</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No payout records found</p>
            <p className="text-xs text-slate-400">
              Clock-in and clock-out workers to auto-calculate daily payouts or click below to register a worker.
            </p>
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
                  <th className="py-3.5 px-4">Worker & Role</th>
                  <th className="py-3.5 px-4">Site / Location</th>
                  <th className="py-3.5 px-4">Clock In / Out</th>
                  <th className="py-3.5 px-4">Hours Worked</th>
                  <th className="py-3.5 px-4">Calculated Pay</th>
                  <th className="py-3.5 px-4">Payout Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => {
                  const workerName = p.worker_name || p.worker?.name || "Worker";
                  const role = p.worker?.role || "Trade Worker";
                  const siteName = p.site_name || "Site";
                  const hours = p.hours_worked || 0;
                  const hoursInt = Math.floor(hours);
                  const minutesInt = Math.round((hours - hoursInt) * 60);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{workerName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {p.worker_id} · <span className="font-sans text-slate-600">{role}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{siteName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{p.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-slate-700">In:</span>
                            <span>{p.attendance?.clock_in_time || (p.attendance?.clock_in?.timestamp ? new Date(p.attendance.clock_in.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—")}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              {p.attendance?.clock_in_status || p.attendance?.clock_in?.status || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-slate-700">Out:</span>
                            <span>{p.attendance?.clock_out_time || (p.attendance?.clock_out?.timestamp ? new Date(p.attendance.clock_out.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—")}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              {p.attendance?.clock_out_status || p.attendance?.clock_out?.status || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {p.hours_worked == null ? "—" : `${hoursInt}h ${minutesInt}m`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ₦{p.daily_wage?.toLocaleString()} / 8h
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-slate-900">
                          ₦{p.amount?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-blue-600 font-medium">
                          {p.payable_hours == null ? "—" : `${p.payable_hours} payable hours`}
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
                          {p.status}
                        </span>
                        {p.payment_reference && (
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            Ref: {p.payment_reference}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "pending" && (
                            <button
                              onClick={() => approvePayoutMutation.mutate(p.id)}
                              disabled={approvePayoutMutation.isPending}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] shadow-sm cursor-pointer"
                              title="Approve Payout"
                            >
                              Approve
                            </button>
                          )}

                          {p.status === "approved" && (
                            <button
                              onClick={() => setMarkPaidPayout(p)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay Now</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveSlipPayout(p)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium cursor-pointer"
                            title="View Payout Slip"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* Slip Modal */}
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

      {/* Register Worker Modal */}
      <RegisterWorkerModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </div>
  );
}

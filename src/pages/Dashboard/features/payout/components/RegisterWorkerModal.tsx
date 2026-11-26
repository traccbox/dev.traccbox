import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Building2,
  Banknote,
  Clock,
  Loader2,
  ExternalLink,
  CreditCard,
  Plus,
  Landmark,
} from "lucide-react";
import { useInfiniteSites, useRegisterWorker } from "@/api/payout/hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { useStaffData } from "@/api/settingsApi/hooks/useStaffData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentMethod } from "@/api/payout/types";
import SitePicker from "./SitePicker";

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
  const navigate = useNavigate();
  const { user, staff } = useAuth();
  const companyId = staff?.company_id || user?.id || "";

  // Fetch staff list from team settings API
  const { data: staffResponse, isLoading: loadingStaff } = useStaffData(companyId);
  const staffList: any[] = Array.isArray(staffResponse)
    ? staffResponse
    : staffResponse?.data || staffResponse?.staffs || staffResponse?.all_staffs || [];

  // Fetch sites (integrated work areas)
  const sitesQuery = useInfiniteSites();
  const sites = sitesQuery.data?.pages.flatMap(page => page.data) || [];

  const registerWorkerMutation = useRegisterWorker();

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Mason");
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [dailyWage, setDailyWage] = useState("7000");
  const [standardHours, setStandardHours] = useState("8");

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Sync site default when sites load
  useEffect(() => {
    if (sites.length > 0 && !siteId) {
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  // When staff selection changes, auto-populate name, phone, trade/role, and bank details if present
  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (!staffId) {
      setName("");
      setPhone("");
      return;
    }
    const selected = staffList.find((s) => String(s.id) === String(staffId));
    if (selected) {
      setName(selected.full_name || selected.name || "");
      setPhone(selected.phone_number || selected.phone || "");
      if (selected.job_title || selected.role) {
        setRole(selected.job_title || selected.role);
      }
      if (selected.account_name || name) {
        setAccountName(selected.account_name || selected.full_name || selected.name || "");
      }
      if (selected.bank_name) setBankName(selected.bank_name);
      if (selected.account_number) setAccountNumber(selected.account_number);
    }
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast.error("Select an existing staff member to register for today.");
      return;
    }

    const selectedSite = siteId || sites[0]?.id;
    if (!selectedSite) {
      toast.error("Please create or select a work area site first");
      return;
    }

    if (paymentMethod === "transfer" && (!bankName.trim() || !accountNumber.trim())) {
      toast.error("Bank Name and Account Number are required for Transfer payment method");
      return;
    }

    registerWorkerMutation.mutate(
      {
        staff_id: selectedStaffId,
        name,
        phone: phone || "+234 800 000 0000",
        role,
        site_id: selectedSite,
        daily_wage: parseFloat(dailyWage) || 7000,
        standard_hours: parseFloat(standardHours) || 8,
        payment_method: paymentMethod,
        bank_name: paymentMethod === "transfer" ? bankName : undefined,
        account_number: paymentMethod === "transfer" ? accountNumber : undefined,
        account_name: paymentMethod === "transfer" ? (accountName || name) : undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setSelectedStaffId("");
          setName("");
          setPhone("");
          setBankName("");
          setAccountNumber("");
          setAccountName("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
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
          {/* Staff Selection Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Select Existing Staff Member *
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/dashboard/settings/team");
                }}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Staff</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {loadingStaff ? (
              <div className="p-2.5 bg-slate-50 border rounded-xl text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading staff directory...</span>
              </div>
            ) : (
              <select
                value={selectedStaffId}
                onChange={(e) => handleStaffSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
              >
                <option value="">-- Choose from existing staff list --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.name} ({s.role || s.job_title || "Staff"}) — {s.phone_number || s.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-populated Worker Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Worker Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Musa Ibrahim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +234 803 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Role & Work Area Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trade / Role
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Site / Work Area *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/dashboard/work-areas");
                  }}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Work Area</span>
                </button>
              </div>

              <SitePicker value={siteId || sites[0]?.id || ""} onChange={setSiteId} includeAll={false} className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 text-xs font-semibold" optionSuffix={s => s.geofence_radius == null ? "Geofence radius varies by boundary" : `${s.geofence_radius}m radius`} />
            </div>
          </div>

          {/* Daily Wage & Standard Hours */}
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

          {/* Payment Method Selection */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "transfer"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "cash"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Payment</span>
                </button>
              </div>
            </div>

            {/* Bank Details Inputs (Shown when Transfer is selected) */}
            {paymentMethod === "transfer" && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  Bank Account Disbursal Details
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required={paymentMethod === "transfer"}
                    placeholder="e.g. Access Bank, GTBank, Zenith, Kuda"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === "transfer"}
                      placeholder="e.g. 0123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Account Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={name || "e.g. Musa Ibrahim"}
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
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

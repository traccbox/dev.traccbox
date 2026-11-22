import React, { useState } from "react";
import { X, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useMarkPayoutPaid } from "@/api/payout/hooks";
import type { DailyPayout } from "@/api/payout/types";

interface Props {
  open: boolean;
  payout?: DailyPayout | null;
  onClose: () => void;
}

export default function MarkPaidModal({ open, payout, onClose }: Props) {
  const markPaidMutation = useMarkPayoutPaid();
  const [paymentRef, setPaymentRef] = useState(
    `TRX-${Math.floor(100000 + Math.random() * 900000)}`
  );

  if (!open || !payout) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markPaidMutation.mutate(
      { payoutId: payout.id, paymentReference: paymentRef },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base tracking-wide">Record Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Worker Payout Confirmation
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {payout.worker_name || payout.worker?.name}
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-semibold">
              <span className="text-slate-600">Calculated Pay:</span>
              <span className="text-emerald-700 font-extrabold text-base">
                ₦{payout.amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Bank Transfer / Transaction Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TRX-992831"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Enter the bank transaction ID, cash voucher reference, or mobile payment receipt code.
            </p>
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
              disabled={markPaidMutation.isPending}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {markPaidMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Payment Executed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { periodLabel } from "@/api/supervisor-kpi/dates";
import { calculateBonus, netPay, totalAllowances, totalDeductions } from "@/api/supervisor-kpi/payroll";
import type { SupervisorPayrollRecord } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import { Avatar, BASE, Empty, Field, PayPill, Panel, PeriodPicker, ScoreBadge, StatTile, btnDanger, btnGhost, btnPrimary, cap, inputCls, lower, useMoney, useTerms } from "./ui";
import { Link } from "react-router-dom";

const ItemEditor: React.FC<{ locked: boolean; title: string; items: SupervisorPayrollRecord["allowances"]; onAdd: (label: string, amount: number) => void; onRemove: (id: string) => void; money: (n: number) => string }> = ({ locked, title, items, onAdd, onRemove, money }) => {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-700">{title}</div>
      {items.length === 0 && <p className="text-xs text-gray-400">None</p>}
      {items.map((i) => (
        <div key={i.id} className="flex items-center justify-between text-xs"><span>{i.label}</span><span className="flex items-center gap-2">{money(i.amount)}{!locked && <button className="text-red-500" onClick={() => onRemove(i.id)}>Remove</button>}</span></div>
      ))}
      {!locked && (
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className={`${inputCls} w-28`} type="number" min={0} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className={btnGhost} disabled={!label.trim() || !(Number(amount) > 0)} onClick={() => { onAdd(label.trim(), Number(amount)); setLabel(""); setAmount(""); }}>Add</button>
        </div>
      )}
    </div>
  );
};

const Payroll: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const money = useMoney();
  const confirm = useConfirm();
  const [open, setOpen] = useState<string | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const [ref, setRef] = useState<Record<string, string>>({});

  const rows = useMemo(() => w.payroll.filter((p) => p.period === w.period), [w.payroll, w.period]);
  const sup = (id: string) => w.supervisors.find((s) => s.id === id);
  const net = (r: SupervisorPayrollRecord) => netPay(r);
  const sum = (st?: SupervisorPayrollRecord["status"]) => rows.filter((r) => !st || r.status === st).reduce((s, r) => s + net(r), 0);
  const pending = rows.filter((r) => r.status === "pending");
  const missingCount = w.supervisors.filter((s) => s.status === "active" && !rows.some((r) => r.supervisorId === s.id)).length;
  const slipRec = rows.find((r) => r.id === slip);

  const approveAll = async () => {
    const ok = await confirm({
      title: `Approve ${pending.length} payroll record${pending.length > 1 ? "s" : ""}?`,
      message: <>Total <strong>{money(sum("pending"))}</strong> for {periodLabel(w.period)}. KPI bonuses are locked at approval.</>,
      confirmLabel: "Approve all",
    });
    if (!ok) return;
    w.approvePayroll(pending.map((p) => p.id));
    toast.success(`${pending.length} approved`);
  };

  const pay = async (r: SupervisorPayrollRecord, reference: string) => {
    const ok = await confirm({
      title: "Record this payment?",
      message: <><strong>{money(net(r))}</strong> to {sup(r.supervisorId)?.name}, reference “{reference}”. A paid record can’t be edited.</>,
      confirmLabel: "Record payment",
    });
    if (ok) w.markPaid(r.id, reference);
  };

  const revert = async (r: SupervisorPayrollRecord) => {
    const ok = await confirm({
      title: "Revert to pending?",
      message: "The approval is removed. The KPI bonus follows live scores again until you re-approve.",
      confirmLabel: "Revert",
    });
    if (ok) w.updatePayroll(r.id, { status: "pending", approvedAt: undefined });
  };

  const exportCsv = () => {
    const head = ["Supervisor", "Period", "Fixed pay", "KPI score", "Bonus", "Allowances", "Deductions", "Net pay", "Status", "Payment reference"];
    const body = rows.map((r) => [sup(r.supervisorId)?.name ?? "", r.period, r.fixedPay, r.kpiScore?.toFixed(1) ?? "N/A", r.bonus, totalAllowances(r.allowances), totalDeductions(r.deductions), net(r), r.status, r.paymentReference ?? ""]);
    const csv = [head, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `payroll-${w.period}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PeriodPicker value={w.period} onChange={w.setPeriod} />
        <div className="flex flex-wrap gap-2">
          {rows.length > 0 && <button className={btnGhost} onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</button>}
          {pending.length > 0 && <button className={btnGhost} onClick={approveAll}>Approve all pending ({pending.length})</button>}
          <button className={btnPrimary} disabled={missingCount === 0} onClick={() => { const n = w.generatePayroll(w.period); toast.success(n ? `${n} payroll record${n > 1 ? "s" : ""} generated` : "Nothing to generate"); }}>
            Generate {periodLabel(w.period)}{missingCount ? ` (${missingCount})` : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total net pay" value={money(sum())} hint={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
        <StatTile label="Pending approval" value={money(sum("pending"))} tone={pending.length ? "warn" : "default"} />
        <StatTile label="Approved, unpaid" value={money(sum("approved"))} />
        <StatTile label="Paid" value={money(sum("paid"))} tone="good" />
      </div>

      <Panel bodyClassName="p-0">
        {rows.length === 0 ? (
          <Empty title={`No payroll for ${periodLabel(w.period)}`} message={w.supervisors.some((s) => s.status === "active") ? `Generate it to calculate each ${lower(T.supervisor)}’s pay from fixed pay and KPI score.` : `Add and activate ${lower(T.supervisors)} first.`} />
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((r) => {
              const s = sup(r.supervisorId);
              const isOpen = open === r.id;
              const locked = r.status !== "pending";
              const frozen = r.status === "paid";
              return (
                <li key={r.id}>
                  <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50" onClick={() => setOpen(isOpen ? null : r.id)}>
                    <span className="flex items-center gap-3"><Avatar name={s?.name ?? "?"} /><span><span className="block text-sm font-medium text-gray-900">{s?.name ?? "Removed"}</span><span className="block text-xs text-gray-500">Fixed {money(r.fixedPay)} · bonus {money(r.bonus)}</span></span></span>
                    <span className="flex items-center gap-3"><ScoreBadge score={r.kpiScore} /><strong className="text-sm">{money(net(r))}</strong><PayPill status={r.status} />{isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-4 border-t border-gray-50 bg-gray-50/50 px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Fixed pay"><input type="number" min={0} disabled={locked} className={inputCls} value={r.fixedPay} onChange={(e) => w.updatePayroll(r.id, { fixedPay: Math.max(0, Number(e.target.value)) })} /></Field>
                        <Field label="Maximum bonus"><input type="number" min={0} disabled={locked} className={inputCls} value={r.maxBonus} onChange={(e) => { w.updatePayroll(r.id, { maxBonus: Math.max(0, Number(e.target.value)) }); w.recalcPayroll(r.id); }} /></Field>
                        <div className="space-y-1"><span className="text-xs font-medium text-gray-700">Bonus earned</span><div className="pt-1.5 text-sm font-semibold">{money(r.bonus)}</div>
                          <p className="text-[11px] text-gray-400">{r.status === "pending" ? `Live from KPI ${r.kpiScore === null ? "N/A" : r.kpiScore.toFixed(0)} (${w.config.pay.bonusMode}). Locked at approval.` : "Locked at approval."}</p></div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ItemEditor locked={locked} title="Allowances" items={r.allowances} money={money} onAdd={(label, amount) => w.addPayItem(r.id, "allowances", { label, amount })} onRemove={(id) => w.removePayItem(r.id, "allowances", id)} />
                        <ItemEditor locked={locked} title="Deductions" items={r.deductions} money={money} onAdd={(label, amount) => w.addPayItem(r.id, "deductions", { label, amount })} onRemove={(id) => w.removePayItem(r.id, "deductions", id)} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className={btnGhost} onClick={() => setSlip(r.id)}>View payslip</button>
                        {r.status === "pending" && <><button className={btnGhost} onClick={() => { w.recalcPayroll(r.id); toast.success("KPI and bonus refreshed"); }}>Refresh KPI</button><button className={btnPrimary} onClick={() => w.approvePayroll([r.id])}>Approve</button></>}
                        {r.status === "approved" && (
                          <>
                            <input className={`${inputCls} max-w-xs`} placeholder="Payment reference" value={ref[r.id] ?? ""} onChange={(e) => setRef({ ...ref, [r.id]: e.target.value })} />
                            <button className={btnPrimary} disabled={!(ref[r.id] ?? "").trim()} onClick={() => pay(r, ref[r.id].trim())}>Record payment</button>
                            <button className={btnDanger} onClick={() => revert(r)}>Revert to pending</button>
                          </>
                        )}
                        {frozen && <span className="text-xs text-gray-500">Paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : ""} · ref {r.paymentReference}</span>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <p className="text-xs text-gray-500">Bonus rules, tiers and the minimum score are set in <Link to={`${BASE}/setup?tab=pay`} className="font-medium text-[#1658E5]">Setup → Pay &amp; access</Link>. Current mode: <strong>{w.config.pay.bonusMode}</strong>{w.config.pay.bonusMode !== "none" && `, minimum KPI ${w.config.pay.minScoreForBonus}`}. {cap(T.supervisors)}’ fixed pay and maximum bonus are on each profile.</p>

      <Dialog open={!!slipRec} onOpenChange={(o) => !o && setSlip(null)}>
        <DialogContent className="max-w-md">
          {slipRec && (
            <>
              <DialogHeader><DialogTitle>Payslip — {sup(slipRec.supervisorId)?.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <p className="text-xs text-gray-500">{periodLabel(slipRec.period)} · {slipRec.status}</p>
                <Line k="Fixed pay" v={money(slipRec.fixedPay)} />
                <Line k={`KPI bonus (score ${slipRec.kpiScore === null ? "N/A" : slipRec.kpiScore.toFixed(0)}, max ${money(slipRec.maxBonus)})`} v={money(slipRec.bonus)} />
                {slipRec.allowances.map((i) => <Line key={i.id} k={i.label} v={`+${money(i.amount)}`} />)}
                {slipRec.deductions.map((i) => <Line key={i.id} k={i.label} v={`−${money(i.amount)}`} />)}
                <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Net pay</span><span>{money(netPay(slipRec))}</span></div>
                {slipRec.paymentReference && <p className="text-xs text-gray-500">Paid {slipRec.paidAt ? new Date(slipRec.paidAt).toLocaleDateString() : ""} · ref {slipRec.paymentReference}</p>}
              </div>
              <button className={btnGhost} onClick={() => window.print()}>Print</button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Line = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><span className="text-gray-600">{k}</span><span>{v}</span></div>;

export default Payroll;

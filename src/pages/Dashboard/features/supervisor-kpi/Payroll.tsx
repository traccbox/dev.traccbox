import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSupervisorStore } from "./store";

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

const Payroll: React.FC = () => {
  const { payroll, supervisors, updatePayroll } = useSupervisorStore();
  const [slip, setSlip] = useState<string | null>(null);
  const [ref, setRef] = useState<Record<string, string>>({});

  return (
    <div className="space-y-3">
      {payroll.map((p) => {
        const s = supervisors.find((x) => x.id === p.supervisorId);
        const bonus = (p.maximumBonus * p.kpiScore) / 100;
        const net = p.fixedPay + bonus - p.deductions;
        return (
          <Card key={p.id}>
            <CardContent className="space-y-2 pt-6 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{s?.name} · {p.period}</strong>
                <Badge>{p.status}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <label className="space-y-1">Fixed pay
                  <Input type="number" min={0} disabled={p.status === "paid"} value={p.fixedPay} onChange={(e) => updatePayroll(p.id, { fixedPay: Math.max(0, Number(e.target.value)) })} />
                </label>
                <label className="space-y-1">Max bonus
                  <Input type="number" min={0} disabled={p.status === "paid"} value={p.maximumBonus} onChange={(e) => updatePayroll(p.id, { maximumBonus: Math.max(0, Number(e.target.value)) })} />
                </label>
                <label className="space-y-1">Deductions
                  <Input type="number" min={0} disabled={p.status === "paid"} value={p.deductions} onChange={(e) => updatePayroll(p.id, { deductions: Math.max(0, Number(e.target.value)) })} />
                </label>
                <div className="space-y-1">KPI score<div className="pt-2 font-medium">{p.kpiScore}</div></div>
              </div>
              <div>Bonus earned {naira(bonus)} · <strong>Net {naira(net)}</strong></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setSlip(slip === p.id ? null : p.id)}>{slip === p.id ? "Hide" : "View"} payslip</Button>
                {p.status === "pending" && <Button onClick={() => updatePayroll(p.id, { status: "approved" })}>Approve</Button>}
                {p.status === "approved" && (
                  <>
                    <Input className="max-w-xs" placeholder="Payment reference" value={ref[p.id] ?? ""} onChange={(e) => setRef({ ...ref, [p.id]: e.target.value })} />
                    <Button disabled={!(ref[p.id] ?? "").trim()} onClick={() => updatePayroll(p.id, { status: "paid", paidAt: new Date().toISOString(), paymentReference: ref[p.id].trim() })}>Record payment</Button>
                  </>
                )}
              </div>
              {slip === p.id && (
                <div className="rounded border p-3">
                  <div>Payslip — {s?.name}, {p.period}</div>
                  <div>Fixed pay: {naira(p.fixedPay)}</div>
                  <div>KPI bonus ({p.kpiScore}% of {naira(p.maximumBonus)}): {naira(bonus)}</div>
                  <div>Deductions: -{naira(p.deductions)}</div>
                  <div className="font-medium">Net pay: {naira(net)}</div>
                  {p.paidAt && <div>Paid {new Date(p.paidAt).toLocaleDateString()} · ref {p.paymentReference} (sample)</div>}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Payroll;

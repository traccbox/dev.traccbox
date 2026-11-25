import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Supervisor } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { Field, areaCls, btnGhost, btnPrimary, inputCls, lower, useMoney, useTerms, cap } from "./ui";

const blank = { name: "", phone: "", email: "", employeeCode: "", title: "", locationIds: [] as string[], fixedPay: "", maxBonus: "", notes: "" };

/** Create or edit a supervisor. Creating sends the mobile-app invite. */
const SupervisorSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  supervisor?: Supervisor;
  onCreated?: (s: Supervisor) => void;
}> = ({ open, onClose, supervisor, onCreated }) => {
  const { locations, supervisors, addSupervisor, updateSupervisor, config } = useWorkforce();
  const T = useTerms();
  const money = useMoney();
  const [f, setF] = useState(blank);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setF(
      supervisor
        ? {
            name: supervisor.name, phone: supervisor.phone, email: supervisor.email ?? "", employeeCode: supervisor.employeeCode ?? "",
            title: supervisor.title ?? "", locationIds: supervisor.locationIds, fixedPay: String(supervisor.fixedPay),
            maxBonus: String(supervisor.maxBonus), notes: supervisor.notes ?? "",
          }
        : blank,
    );
  }, [open, supervisor]);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const digits = (s: string) => s.replace(/[^\d+]/g, "");
  const phoneTaken = supervisors.some((s) => s.id !== supervisor?.id && digits(s.phone) === digits(f.phone));
  const errors = {
    name: !f.name.trim() ? "Name is required" : "",
    phone: !f.phone.trim() ? "Phone is required — it’s their mobile app login" : phoneTaken ? "Another supervisor already uses this number" : "",
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter a valid email" : "",
    pay: Number(f.fixedPay) < 0 || Number(f.maxBonus) < 0 ? "Pay cannot be negative" : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const toggleLoc = (id: string) =>
    setF({ ...f, locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id] });

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const base = {
      name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined, employeeCode: f.employeeCode.trim() || undefined,
      title: f.title.trim() || undefined, locationIds: f.locationIds, fixedPay: Number(f.fixedPay) || 0, maxBonus: Number(f.maxBonus) || 0,
      notes: f.notes.trim() || undefined,
    };
    if (supervisor) {
      updateSupervisor(supervisor.id, base);
      toast.success("Changes saved");
    } else {
      const created = addSupervisor(base);
      toast.success(`${f.name.trim()} added`, { description: "An invite to the mobile app will be sent to their phone/email." });
      onCreated?.(created);
    }
    onClose();
  };

  const err = (k: keyof typeof errors) => (touched && errors[k] ? <span className="block text-[11px] text-red-600">{errors[k]}</span> : null);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{supervisor ? `Edit ${lower(T.supervisor)}` : `Add ${lower(T.supervisor)}`}</SheetTitle>
          <SheetDescription>
            {supervisor
              ? "Update profile, assigned locations and pay."
              : `They’ll receive an invite to the mobile app, where they manage their ${lower(T.workers)}, log progress and file daily reports.`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <Field label="Full name" required><input className={inputCls} value={f.name} onChange={set("name")} />{err("name")}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required hint="Used to log in on the mobile app"><input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="+234…" />{err("phone")}</Field>
            <Field label="Email"><input className={inputCls} value={f.email} onChange={set("email")} />{err("email")}</Field>
            <Field label="Job title"><input className={inputCls} value={f.title} onChange={set("title")} placeholder={cap(T.supervisor)} /></Field>
            <Field label="Employee code"><input className={inputCls} value={f.employeeCode} onChange={set("employeeCode")} /></Field>
          </div>

          <Field label={`${cap(T.locations)} they oversee`}>
            {locations.filter((l) => l.status === "active").length === 0 ? (
              <p className="text-xs text-gray-500">No {lower(T.locations)} yet — add them in Setup, then assign here.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {locations.filter((l) => l.status === "active").map((l) => {
                  const on = f.locationIds.includes(l.id);
                  return (
                    <button key={l.id} type="button" onClick={() => toggleLoc(l.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-[#1658E5] bg-blue-50 text-[#1658E5]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {l.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Fixed pay (${config.currency.code}/month)`}><input type="number" min={0} className={inputCls} value={f.fixedPay} onChange={set("fixedPay")} /></Field>
            <Field label="Maximum KPI bonus" hint={f.maxBonus ? `Up to ${money(Number(f.maxBonus))} on top` : "Paid according to KPI score"}><input type="number" min={0} className={inputCls} value={f.maxBonus} onChange={set("maxBonus")} />{err("pay")}</Field>
          </div>
          <Field label="Internal notes"><textarea rows={3} className={areaCls} value={f.notes} onChange={set("notes")} /></Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} onClick={submit}>{supervisor ? "Save changes" : "Add & send invite"}</button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SupervisorSheet;

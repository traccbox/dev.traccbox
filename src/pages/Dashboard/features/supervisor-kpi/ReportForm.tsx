import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ymd } from "@/api/supervisor-kpi/dates";
import type { ReportAnswer, ReportField } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { Field, areaCls, btnGhost, btnPrimary, cap, inputCls, lower, useTerms } from "./ui";

/** Renders one question of the workspace's daily report form. Shared with the Setup preview. */
export const FieldInput: React.FC<{
  field: ReportField;
  value: ReportAnswer | undefined;
  onChange: (v: ReportAnswer | undefined) => void;
  invalid?: boolean;
}> = ({ field, value, onChange, invalid }) => {
  const border = invalid ? "border-red-300" : "";
  switch (field.type) {
    case "number":
      return <input type="number" className={`${inputCls} ${border}`} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
    case "longtext":
      return <textarea rows={2} className={`${areaCls} ${border}`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)} />;
    case "yesno":
      return (
        <div className="flex gap-2">
          {[true, false].map((b) => (
            <button key={String(b)} type="button" onClick={() => onChange(b)} className={`h-9 flex-1 rounded-lg border text-sm font-medium ${value === b ? "border-[#1658E5] bg-blue-50 text-[#1658E5]" : `border-gray-200 text-gray-600 hover:bg-gray-50 ${border}`}`}>{b ? "Yes" : "No"}</button>
          ))}
        </div>
      );
    case "rating":
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} className={`h-9 w-9 rounded-lg border text-sm font-semibold ${value === n ? "border-[#1658E5] bg-[#1658E5] text-white" : `border-gray-200 text-gray-600 hover:bg-gray-50 ${border}`}`}>{n}</button>
          ))}
        </div>
      );
    case "select":
      return (
        <select className={`${inputCls} ${border}`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case "photo":
      return <input className={`${inputCls} ${border}`} placeholder="Photo reference (uploaded from the mobile app)" value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)} />;
    default:
      return <input className={`${inputCls} ${border}`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)} />;
  }
};

export const formatAnswer = (f: ReportField, v: ReportAnswer | undefined): string => {
  if (v === undefined || v === "") return "—";
  if (f.type === "yesno") return v ? "Yes" : "No";
  if (f.type === "rating") return `${v} / 5`;
  return String(v);
};

/** File a daily report on behalf of a supervisor (the normal path is the mobile app). */
const ReportForm: React.FC<{ open: boolean; onClose: () => void; supervisorId?: string }> = ({ open, onClose, supervisorId }) => {
  const { supervisors, workers, config, addReport, reports } = useWorkforce();
  const T = useTerms();
  const [sup, setSup] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [assigned, setAssigned] = useState("");
  const [present, setPresent] = useState("");
  const [answers, setAnswers] = useState<Record<string, ReportAnswer | undefined>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSup(supervisorId ?? ""); setDate(ymd(new Date())); setAnswers({}); setTouched(false); setPresent("");
    setAssigned(supervisorId ? String(workers.filter((x) => x.supervisorId === supervisorId && x.status === "active").length) : "");
  }, [open, supervisorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = supervisors.find((x) => x.id === sup);
  const { fields, includeAttendance } = config.report;
  const aN = Number(assigned), pN = Number(present);
  const missing = fields.filter((f) => f.required && (answers[f.id] === undefined || answers[f.id] === ""));
  const attendanceBad = includeAttendance && (assigned === "" || present === "" || pN > aN || aN < 0 || pN < 0);
  const valid = !!s && !!date && missing.length === 0 && !attendanceBad;
  const exists = reports.some((r) => r.supervisorId === sup && r.reportDate === date && r.reviewStatus !== "returned");

  const submit = () => {
    setTouched(true);
    if (!valid || !s) return;
    addReport({
      supervisorId: s.id, locationId: s.locationIds[0] ?? "", reportDate: date,
      workersAssigned: includeAttendance ? aN : 0, workersPresent: includeAttendance ? pN : 0,
      answers: Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== undefined)) as Record<string, ReportAnswer>,
    });
    toast.success("Report filed on behalf of " + s.name);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>File a daily report</SheetTitle>
          <SheetDescription>Normally submitted by the {lower(T.supervisor)} from the mobile app. Use this when they can’t. It is marked as filed by admin.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={cap(T.supervisor)} required>
              <select className={inputCls} value={sup} onChange={(e) => { setSup(e.target.value); setAssigned(String(workers.filter((x) => x.supervisorId === e.target.value && x.status === "active").length)); }}>
                <option value="">Select…</option>
                {supervisors.filter((x) => x.status === "active").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
            <Field label="Report date" required><input type="date" max={ymd(new Date())} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          </div>
          {exists && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">A report already exists for this day. Filing again replaces it.</p>}

          {includeAttendance && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${cap(T.workers)} assigned`} required><input type="number" min={0} className={inputCls} value={assigned} onChange={(e) => setAssigned(e.target.value)} /></Field>
              <Field label={`${cap(T.workers)} present`} required><input type="number" min={0} className={`${inputCls} ${touched && attendanceBad ? "border-red-300" : ""}`} value={present} onChange={(e) => setPresent(e.target.value)} />
                {pN > aN && <span className="text-[11px] text-red-600">Present can’t exceed assigned</span>}</Field>
            </div>
          )}

          {fields.map((f) => (
            <Field key={f.id} label={f.label} required={f.required} hint={f.help}>
              <FieldInput field={f} value={answers[f.id]} onChange={(v) => setAnswers({ ...answers, [f.id]: v })} invalid={touched && f.required && (answers[f.id] === undefined || answers[f.id] === "")} />
            </Field>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} onClick={submit}>File report</button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportForm;

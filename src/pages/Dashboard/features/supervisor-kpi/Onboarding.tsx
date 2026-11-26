import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { INDUSTRY_PRESETS } from "@/api/supervisor-kpi/presets";
import { isNameTaken } from "@/api/supervisor-kpi/workspaces";
import type { IndustryKey } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { useConfirm } from "./Confirm";
import { BASE, Field, Toggle, btnGhost, btnPrimary, inputCls } from "./ui";

export const CURRENCIES = [
  ["NGN", "Nigerian Naira"], ["USD", "US Dollar"], ["GBP", "British Pound"], ["EUR", "Euro"],
  ["GHS", "Ghanaian Cedi"], ["KES", "Kenyan Shilling"], ["ZAR", "South African Rand"],
  ["XOF", "West African CFA"], ["INR", "Indian Rupee"], ["AED", "UAE Dirham"], ["CAD", "Canadian Dollar"],
] as const;

/** First-time setup, or ("add") creating a further, completely separate workspace. */
const Onboarding: React.FC = () => {
  const { createWorkspace, workspaces, name: currentName, config } = useWorkforce();
  const confirm = useConfirm();
  const nav = useNavigate();
  const adding = workspaces.length > 0;
  const [industry, setIndustry] = useState<IndustryKey>("construction");
  const [currency, setCurrency] = useState(adding ? config.currency.code : "NGN");
  const [withSample, setWithSample] = useState(!adding);
  const [typedName, setTypedName] = useState<string | null>(null);
  const preset = INDUSTRY_PRESETS.find((p) => p.key === industry)!;

  // Suggest the industry name, numbered if it is already used.
  let suggested = preset.key === "custom" ? "My business" : preset.label;
  for (let n = 2; isNameTaken(suggested, workspaces); n++) suggested = `${preset.label} ${n}`;
  const name = typedName ?? suggested;
  const nameError = !name.trim() ? "Give this workspace a name" : isNameTaken(name, workspaces) ? "You already have a workspace with this name" : "";

  const create = async () => {
    if (adding) {
      const ok = await confirm({
        title: "Create a separate workspace?",
        message: (
          <>
            <strong>{name.trim()}</strong> ({preset.label}) is created alongside <strong>{currentName}</strong>. It has its own people,
            tasks, reports, scorecard and payroll. Nothing in your other workspaces changes, and you can switch at any time.
          </>
        ),
        confirmLabel: "Create and switch",
      });
      if (!ok) return;
    }
    nav(BASE, { replace: true });
    createWorkspace({ name, industry, currency, withSample });
    toast.success(`${name.trim()} created`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {adding && (
        <button className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#1658E5]" onClick={() => nav(BASE)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {currentName}
        </button>
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{adding ? "Add another industry" : "Set up Workforce & Supervisor"}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          {adding
            ? "Create a second, independent workspace for another business line. Your existing workspaces stay exactly as they are."
            : "Pick the closest match for your business. We pre-fill wording, units, the daily report form, the KPI scorecard and pay rules. You can change every part later in Setup."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRY_PRESETS.map((p) => {
          const on = p.key === industry;
          return (
            <button
              key={p.key}
              onClick={() => setIndustry(p.key)}
              className={`relative rounded-2xl border p-4 text-left transition-all ${on ? "border-[#1658E5] bg-blue-50/50 ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              {on && <Check className="absolute right-3 top-3 h-4 w-4 text-[#1658E5]" />}
              <div className="text-sm font-semibold text-gray-900">{p.label}</div>
              <p className="mt-1 text-xs text-gray-500">{p.blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">What you’ll get</h2>
        <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-4">
          {[
            ["Your words", `${preset.terms.supervisors} manage ${preset.terms.workers.toLowerCase()} across ${preset.terms.locations.toLowerCase()}`],
            ["Units", preset.units.slice(0, 4).join(", ")],
            ["Task types", preset.templates.map((x) => x.name).join(", ")],
            ["Daily report", `${preset.fields.length} questions + attendance`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-medium text-gray-500">{k}</dt>
              <dd className="mt-0.5 text-gray-800">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Workspace name" required hint="How you’ll recognise it when switching">
            <input className={`${inputCls} ${nameError ? "border-red-300" : ""}`} value={name} onChange={(e) => setTypedName(e.target.value)} />
            {nameError && <span className="block text-[11px] text-red-600">{nameError}</span>}
          </Field>
          <Field label="Pay currency">
            <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <Toggle checked={withSample} onChange={setWithSample} label="Load sample data" hint="A week of example activity so you can explore. Reset any time in Setup." />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {adding && <button className={btnGhost} onClick={() => nav(BASE)}>Cancel</button>}
        <button className={btnPrimary} disabled={!!nameError} onClick={create}>
          Create workspace
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

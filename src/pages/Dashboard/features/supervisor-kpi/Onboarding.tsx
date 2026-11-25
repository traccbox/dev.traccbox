import React, { useState } from "react";
import { Check } from "lucide-react";
import { INDUSTRY_PRESETS } from "@/api/supervisor-kpi/presets";
import type { IndustryKey } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { Field, Toggle, btnPrimary, inputCls } from "./ui";

export const CURRENCIES = [
  ["NGN", "Nigerian Naira"], ["USD", "US Dollar"], ["GBP", "British Pound"], ["EUR", "Euro"],
  ["GHS", "Ghanaian Cedi"], ["KES", "Kenyan Shilling"], ["ZAR", "South African Rand"],
  ["XOF", "West African CFA"], ["INR", "Indian Rupee"], ["AED", "UAE Dirham"], ["CAD", "Canadian Dollar"],
] as const;

const Onboarding: React.FC = () => {
  const { completeSetup } = useWorkforce();
  const [industry, setIndustry] = useState<IndustryKey>("construction");
  const [currency, setCurrency] = useState("NGN");
  const [withSample, setWithSample] = useState(true);
  const preset = INDUSTRY_PRESETS.find((p) => p.key === industry)!;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Set up Workforce &amp; Supervisor</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          Pick the closest match for your business. We pre-fill wording, units, the daily report form,
          the KPI scorecard and pay rules. You can change every part later in Setup.
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

      <div className="flex justify-end">
        <button className={btnPrimary} onClick={() => completeSetup({ industry, currency, withSample })}>
          Create workspace
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

import React from "react";
import { Check, Sparkles } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { PLAN_TIERS } from "@/api/mock/subscription";

const PlanComparison: React.FC = () => (
  <div>
    <PageHeader
      title="Plan Comparison"
      description="Choose the plan that matches your field team size."
      crumbs={[{ label: "Subscription" }, { label: "Plan Comparison" }]}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {PLAN_TIERS.map((p) => (
        <div
          key={p.name}
          className={`relative rounded-2xl border p-5 shadow-sm bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
            p.highlight ? "border-[#1658E5] ring-2 ring-blue-100" : "border-gray-100"
          }`}
        >
          {p.highlight && (
            <span className="absolute -top-3 left-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1658E5] text-white text-[10px] font-semibold">
              <Sparkles className="w-3 h-3" /> Current Plan
            </span>
          )}
          <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
          <p className="mt-2">
            <span className="text-2xl font-bold text-gray-900">{p.price}</span>
            <span className="text-xs text-gray-500">{p.cadence}</span>
          </p>
          <div className="mt-4 space-y-1 text-xs text-gray-600">
            <p className="font-medium text-gray-900">{p.employees}</p>
            <p>{p.storage}</p>
            <p>{p.support}</p>
          </div>
          <ul className="mt-4 space-y-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className="w-4 h-4 text-[#1658E5] shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button
            className={`mt-5 w-full h-10 rounded-lg text-xs font-semibold transition-colors ${
              p.highlight
                ? "bg-blue-50 text-[#1658E5] cursor-default"
                : "bg-[#1658E5] text-white hover:bg-[#1249bd]"
            }`}
          >
            {p.cta}
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default PlanComparison;

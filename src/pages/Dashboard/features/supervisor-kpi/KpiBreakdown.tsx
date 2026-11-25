import React from "react";
import type { SupervisorKpiResult } from "@/api/supervisor-kpi/types";
import { Pill, ProgressBar, scoreTone } from "./ui";

/** Score + per-metric breakdown with the evidence behind every number. */
const KpiBreakdown: React.FC<{ result: SupervisorKpiResult }> = ({ result }) => {
  const tone = scoreTone(result.score);
  const color = { default: "text-gray-400", good: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" }[tone];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className={`text-4xl font-bold ${color}`}>
          {result.score === null ? "N/A" : result.score.toFixed(1)}
          <span className="ml-1 text-base font-medium text-gray-400">/ 100</span>
        </div>
        <p className="max-w-sm text-xs text-gray-500">
          {result.score === null
            ? "No evidence recorded in this period yet."
            : result.eligibleWeight < 100
              ? `Scored on ${result.eligibleWeight}% of the scorecard. Metrics with no evidence are skipped and their weight is shared across the rest.`
              : "Scored on the full scorecard."}
        </p>
      </div>

      <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
        {result.components.map((c) => (
          <li key={c.metricId} className="space-y-1.5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                {c.label}
                <span className="text-xs font-normal text-gray-400">{c.weight}% weight</span>
                {c.source === "manual" && <Pill tone="purple">Manager score</Pill>}
                {c.source === "report_field" && <Pill tone="blue">From daily report</Pill>}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {c.achievement === null ? <span className="text-gray-400">N/A</span> : `${c.achievement.toFixed(0)}%`}
                {c.weightedScore !== null && <span className="ml-2 text-xs font-normal text-gray-400">+{c.weightedScore.toFixed(1)} pts</span>}
              </div>
            </div>
            <ProgressBar value={c.achievement ?? 0} tone={c.achievement === null ? "blue" : c.achievement >= 80 ? "green" : c.achievement >= 60 ? "amber" : "red"} />
            <p className="text-xs text-gray-500">{c.detail}</p>
          </li>
        ))}
        {result.components.length === 0 && <li className="p-4 text-center text-xs text-gray-400">No metrics are enabled. Configure the scorecard in Setup.</li>}
      </ul>
    </div>
  );
};

export default KpiBreakdown;

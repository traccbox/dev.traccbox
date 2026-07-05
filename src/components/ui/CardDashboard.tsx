import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

type CardDashboardType = {
  title: string;
  numValue: number;
  percent: number;
  icon: React.ReactNode;
  index: number;
  /** Optional real trend data — falls back to a deterministic mock series. */
  data?: number[];
};

const PALETTES = [
  {
    // Primary blue
    gradientFrom: "#1E63D8",
    gradientTo: "#0F5496",
    accent: "#3B82F6",
    soft: "#E8F0FE",
    icon: "#0F5496",
  },
  {
    // Indigo
    gradientFrom: "#4F46E5",
    gradientTo: "#3730A3",
    accent: "#6366F1",
    soft: "#EEF0FF",
    icon: "#3730A3",
  },
  {
    // Teal / success
    gradientFrom: "#0EA5A5",
    gradientTo: "#0F766E",
    accent: "#14B8A6",
    soft: "#E6FBF7",
    icon: "#0F766E",
  },
  {
    // Amber
    gradientFrom: "#F59E0B",
    gradientTo: "#B45309",
    accent: "#F59E0B",
    soft: "#FEF3E0",
    icon: "#B45309",
  },
];

// Deterministic pseudo-random series so cards feel like real trending data
// even before a live time-series feed is wired in.
function buildSeries(seed: number, points = 12, value = 20): number[] {
  const arr: number[] = [];
  let s = Math.abs(seed) + 7;
  const base = Math.max(1, value);
  for (let i = 0; i < points; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rand = s / 233280;
    const wave = Math.sin(i / 1.7) * 0.25;
    arr.push(Number((base * (0.55 + rand * 0.5 + wave)).toFixed(2)));
  }
  // ensure last point ≈ current value so the chart "ends" at today's number
  arr[arr.length - 1] = base;
  return arr;
}

export default function CardDashboard({
  index,
  icon,
  percent,
  numValue,
  title,
  data,
}: CardDashboardType) {
  const palette = PALETTES[(index - 1 + PALETTES.length) % PALETTES.length];
  const isUp = percent >= 0;

  const series = (data && data.length ? data : buildSeries(index * 31 + numValue, 12, numValue || 10)).map(
    (v, i) => ({ i, v }),
  );

  const gradId = `card-grad-${index}-${title.replace(/\s+/g, "-")}`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-[130px] lg:h-[150px] flex flex-col"
      style={{
        background: `linear-gradient(145deg, ${palette.soft} 0%, #ffffff 70%)`,
        borderColor: `${palette.accent}33`,
      }}
    >
      {/* Decorative corner gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-2xl"
        style={{
          background: `radial-gradient(circle at center, ${palette.accent}, transparent 70%)`,
        }}
      />

      {/* Top: title + icon */}
      <div className="relative flex items-start justify-between px-5 pt-5">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl font-semibold text-slate-900 tabular-nums leading-none">
              {numValue.toLocaleString()}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isUp
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {isUp ? (
                <ArrowUpRight size={12} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={12} strokeWidth={2.5} />
              )}
              {Math.abs(percent)}%
            </span>
            <span className="text-xs text-slate-500">vs. last week</span>
          </div>
        </div>

        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-sm text-white"
          style={{
            background: `linear-gradient(135deg, ${palette.gradientFrom}, ${palette.gradientTo})`,
          }}
        >
          <span className="[&_svg]:w-5 [&_svg]:h-5">{icon}</span>
        </div>
      </div>

      {/* Bottom: real sparkline chart */}
      <div className="relative mt-auto h-12 lg:h-14 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.accent} stopOpacity={0.45} />
                <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              cursor={{ stroke: palette.accent, strokeDasharray: 3 }}
              contentStyle={{
                background: "white",
                border: `1px solid ${palette.accent}33`,
                borderRadius: 8,
                padding: "4px 8px",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
              }}
              labelFormatter={() => ""}
              formatter={(v: number) => [v.toLocaleString(), title]}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={palette.accent}
              strokeWidth={2.25}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, stroke: "white", strokeWidth: 2, fill: palette.accent }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

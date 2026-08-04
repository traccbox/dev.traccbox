import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const PALETTES = [
  { soft: "#E8F0FE", icon: "#0F5496", accent: "#1E63D8" },
  { soft: "#EEF0FF", icon: "#3730A3", accent: "#4F46E5" },
  { soft: "#E6FBF7", icon: "#0F766E", accent: "#0EA5A5" },
  { soft: "#FEF3E0", icon: "#B45309", accent: "#F59E0B" },
  { soft: "#FDE8EF", icon: "#9F1239", accent: "#E11D48" },
  { soft: "#F1E9FE", icon: "#6D28D9", accent: "#8B5CF6" },
];

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  percent?: number;
  icon?: React.ReactNode;
  index?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  percent,
  icon,
  index = 0,
}) => {
  const p = PALETTES[index % PALETTES.length];
  const up = (percent ?? 0) >= 0;
  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: `linear-gradient(135deg, ${p.soft} 0%, #ffffff 65%)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <span
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#ffffff", color: p.icon }}
          >
            {icon}
          </span>
        )}
      </div>
      {typeof percent === "number" && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <span
            className={`flex items-center gap-0.5 ${
              up ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {up ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {Math.abs(percent)}%
          </span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

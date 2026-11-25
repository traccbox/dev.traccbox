import type { PayItem, PayRules, SupervisorPayrollRecord } from "./types";

export function calculateBonus(score: number | null, maxBonus: number, rules: PayRules): number {
  if (score === null || rules.bonusMode === "none" || maxBonus <= 0) return 0;
  if (score < rules.minScoreForBonus) return 0;
  if (rules.bonusMode === "proportional") return Math.round((maxBonus * score) / 100);
  const tier = [...rules.tiers]
    .sort((a, b) => b.minScore - a.minScore)
    .find((t) => score >= t.minScore);
  return tier ? Math.round((maxBonus * tier.payoutPercent) / 100) : 0;
}

const sum = (items: PayItem[]) => items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

export const netPay = (r: Pick<SupervisorPayrollRecord, "fixedPay" | "bonus" | "allowances" | "deductions">) =>
  r.fixedPay + r.bonus + sum(r.allowances) - sum(r.deductions);

export const totalAllowances = sum;
export const totalDeductions = sum;

export const formatMoney = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
};

import assert from "node:assert/strict";
import test from "node:test";
import { enabledWeightTotal, calculateWeightedKpi, getSupervisorKpi, normalizeWeights, planningScore } from "./kpi";
import { calculateBonus, netPay } from "./payroll";
import { buildIndustryConfig, buildSampleData, INDUSTRY_PRESETS } from "./presets";
import { currentPeriod } from "./dates";
import type { KpiComponent, KpiMetricConfig, OperationalTask } from "./types";

const comp = (metricId: string, weight: number, achievement: number | null): KpiComponent => ({
  metricId, label: metricId, source: "system", weight, achievement,
  evidenceCount: achievement === null ? 0 : 1, detail: "", weightedScore: null,
});

test("every industry template ships a scorecard that totals exactly 100%", () => {
  for (const p of INDUSTRY_PRESETS) {
    const { config } = buildIndustryConfig(p.key);
    assert.equal(enabledWeightTotal(config.kpi), 100, p.key);
  }
});

test("components without evidence are skipped and their weight is redistributed", () => {
  const r = calculateWeightedKpi([comp("a", 50, 80), comp("b", 50, null)]);
  assert.equal(r.score, 80);
  assert.equal(r.eligibleWeight, 50);
});

test("no evidence at all gives N/A, never zero", () => {
  assert.equal(calculateWeightedKpi([comp("a", 60, null), comp("b", 40, null)]).score, null);
});

test("normalizeWeights rescales enabled metrics to 100 and leaves disabled ones alone", () => {
  const ms = [30, 30, 30, 5].map((weight, i): KpiMetricConfig => ({ id: `m${i}`, label: "", description: "", weight, enabled: i < 3, source: "manual" }));
  const out = normalizeWeights(ms);
  assert.equal(enabledWeightTotal(out), 100);
  assert.equal(out[3].weight, 5);
});

test("bonus: proportional, tiered and below-threshold", () => {
  const prop = { bonusMode: "proportional" as const, minScoreForBonus: 50, tiers: [] };
  assert.equal(calculateBonus(80, 10000, prop), 8000);
  assert.equal(calculateBonus(40, 10000, prop), 0);
  assert.equal(calculateBonus(null, 10000, prop), 0);
  const tiered = { bonusMode: "tiered" as const, minScoreForBonus: 0, tiers: [{ minScore: 90, payoutPercent: 100 }, { minScore: 70, payoutPercent: 50 }] };
  assert.equal(calculateBonus(95, 10000, tiered), 10000);
  assert.equal(calculateBonus(75, 10000, tiered), 5000);
  assert.equal(calculateBonus(60, 10000, tiered), 0);
  assert.equal(calculateBonus(99, 10000, { ...prop, bonusMode: "none" }), 0);
});

test("net pay adds allowances and subtracts deductions", () => {
  assert.equal(netPay({ fixedPay: 100, bonus: 20, allowances: [{ id: "a", label: "", amount: 5 }], deductions: [{ id: "d", label: "", amount: 10 }] }), 115);
});

const task = (o: Partial<OperationalTask>): OperationalTask => ({
  id: "t", code: "T", title: "t", description: "d", locationId: "l", supervisorId: "s", workerIds: ["w"], unit: "units",
  targetQuantity: 100, submittedOutput: 0, reviewedOutput: 0, approvedOutput: 0, status: "in_progress", priority: "normal",
  requiresReview: true, requiresEvidence: false, startsAt: new Date(2026, 10, 1).toISOString(), dueAt: new Date(2026, 10, 20).toISOString(),
  checklist: [], progress: [], reworkCount: 0, createdAt: "", createdBy: "", ...o,
});

test("planning score reflects missing setup details", () => {
  assert.equal(planningScore(task({})), 100);
  assert.equal(planningScore(task({ workerIds: [], description: "" })), 60);
});

test("output is scored per task, so different units are never summed", () => {
  const { config } = buildIndustryConfig("custom");
  const r = getSupervisorKpi({
    supervisorId: "s", period: "2026-11", now: new Date(2026, 10, 25),
    tasks: [task({ id: "a", unit: "blocks", targetQuantity: 1000, submittedOutput: 500 }), task({ id: "b", unit: "sq m", targetQuantity: 10, submittedOutput: 10 })],
    reports: [], manualScores: [], metrics: config.kpi, reportTemplate: config.report,
  });
  const out = r.components.find((c) => c.label === "Output vs target");
  assert.equal(out?.achievement, 75);
});

test("missing required report days lower reporting discipline", () => {
  const { config } = buildIndustryConfig("custom");
  const report = { ...config.report, requiredDays: [0, 1, 2, 3, 4, 5, 6] };
  const r = getSupervisorKpi({
    supervisorId: "s", period: "2026-11", now: new Date(2026, 10, 5, 12),
    tasks: [], manualScores: [], metrics: config.kpi, reportTemplate: report,
    reports: [{ id: "r", supervisorId: "s", locationId: "l", reportDate: "2026-11-01", workersAssigned: 4, workersPresent: 4, answers: {}, submittedAt: new Date(2026, 10, 1, 10).toISOString(), source: "mobile", reviewStatus: "approved" }],
  });
  const c = r.components.find((x) => x.label === "Reporting discipline");
  assert.equal(c?.evidenceCount, 4); // Nov 1–4 are due; Nov 5 is not yet
  assert.equal(c?.achievement, 25);
});

test("sample data works for every industry and produces a real KPI", () => {
  for (const p of INDUSTRY_PRESETS) {
    const { config, templates } = buildIndustryConfig(p.key);
    const d = buildSampleData(p.key, config, templates);
    assert.ok(d.supervisors.length >= 3 && d.tasks.length >= 4 && d.reports.length > 0, p.key);
    const r = getSupervisorKpi({ supervisorId: d.supervisors[0].id, period: currentPeriod(), tasks: d.tasks, reports: d.reports, manualScores: [], metrics: config.kpi, reportTemplate: config.report });
    assert.ok(r.components.length > 0, p.key);
  }
});

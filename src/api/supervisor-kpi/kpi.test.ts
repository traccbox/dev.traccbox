import assert from "node:assert/strict";
import test from "node:test";
import { enabledWeightTotal, calculateWeightedKpi, getSupervisorKpi, normalizeWeights, planningScore } from "./kpi";
import { calculateBonus, netPay } from "./payroll";
import { buildIndustryConfig, buildSampleData, INDUSTRY_PRESETS } from "./presets";
import { currentPeriod } from "./dates";
import { addWorkspace, createWorkspace, isNameTaken, loadRoot, locationInUse, removeWorkspace, syncWorkAreaLocations } from "./workspaces";
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

const make = (name: string, withSample = true) => createWorkspace({ name, industry: "logistics", currency: "NGN", withSample });

test("workspaces are independent and creating one activates it", () => {
  const a = make("A");
  const b = createWorkspace({ name: "B", industry: "healthcare", currency: "USD", withSample: false });
  const root = addWorkspace(addWorkspace({ activeId: null, workspaces: [] }, a), b);
  assert.equal(root.activeId, b.id);
  assert.equal(root.workspaces.length, 2);
  assert.ok(root.workspaces[0].supervisors.length > 0);
  assert.equal(root.workspaces[1].supervisors.length, 0);
  assert.notEqual(root.workspaces[0].config.terms.location, root.workspaces[1].config.terms.location);
});

test("deleting the active workspace falls back to another, then to none", () => {
  const a = make("A"), b = make("B");
  let root = addWorkspace(addWorkspace({ activeId: null, workspaces: [] }, a), b);
  root = removeWorkspace(root, b.id);
  assert.equal(root.activeId, a.id);
  assert.deepEqual(removeWorkspace(root, a.id), { activeId: null, workspaces: [] });
});

test("workspace names are unique, ignoring case and spaces", () => {
  const a = make("Acme");
  assert.equal(isNameTaken(" acme ", [a]), true);
  assert.equal(isNameTaken("Acme", [a], a.id), false);
});

test("the earlier single-workspace save is migrated without losing data", () => {
  const { id: _i, name: _n, createdAt: _c, ...data } = make("old");
  const legacy = JSON.stringify({ ...data, setupDone: true, locations: data.locations.map(({ source: _s, ...l }) => l) });
  const root = loadRoot(null, legacy);
  assert.equal(root.workspaces.length, 1);
  assert.equal(root.activeId, root.workspaces[0].id);
  assert.equal(root.workspaces[0].supervisors.length, data.supervisors.length);
  assert.ok(root.workspaces[0].locations.every((l) => l.source === "local"));
});

test("once saved in the new format, deleted workspaces don't come back from the old save", () => {
  const legacy = JSON.stringify({ ...make("old"), setupDone: true });
  assert.equal(loadRoot(JSON.stringify({ activeId: null, workspaces: [] }), legacy).workspaces.length, 0);
});

test("corrupt storage starts clean", () => {
  assert.deepEqual(loadRoot("{not json", "also bad"), { activeId: null, workspaces: [] });
});

test("linked work areas refresh, archive when gone, and keep identity when unchanged", () => {
  const ws = { ...make("A", false), locations: [{ id: "wa1", source: "work_area" as const, name: "Old name", status: "active" as const }] };
  const root = { activeId: ws.id, workspaces: [ws] };
  const renamed = syncWorkAreaLocations(root, [{ id: "wa1", source: "work_area", name: "New name", status: "active" }], true);
  assert.equal(renamed.workspaces[0].locations[0].name, "New name");
  assert.equal(syncWorkAreaLocations(renamed, [{ id: "wa1", source: "work_area", name: "New name", status: "active" }], true), renamed);
  assert.equal(syncWorkAreaLocations(root, [], true).workspaces[0].locations[0].status, "archived");
  assert.equal(syncWorkAreaLocations(root, [], false), root); // partial list proves nothing
});

test("a location with assigned people or open work can't be removed", () => {
  const ws = make("A");
  assert.ok(locationInUse(ws, ws.supervisors[0].locationIds[0]));
  assert.equal(locationInUse(ws, "unused"), null);
});

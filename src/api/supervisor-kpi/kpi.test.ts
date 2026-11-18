import assert from "node:assert/strict";
import test from "node:test";
import { calculateWeightedKpi, KPI_WEIGHTS } from "./kpi";
import type { KpiComponent } from "./types";

const component = (key: KpiComponent["key"], weight: number, achievement: number | null): KpiComponent => ({
  key,
  label: key,
  weight,
  achievement,
  evidenceCount: achievement === null ? 0 : 1,
  detail: "test evidence",
  weightedScore: null,
});

test("KPI weights match the specified 25/30/20/15/10 split and total 100%", () => {
  assert.deepEqual(Object.values(KPI_WEIGHTS), [25, 30, 20, 15, 10]);
  assert.equal(Object.values(KPI_WEIGHTS).reduce((sum, weight) => sum + weight, 0), 100);
});

test("weighted KPI formula returns the documented example score of 88", () => {
  const result = calculateWeightedKpi([
    component("planning", 25, 90),
    component("productivity", 30, 85),
    component("quality", 20, 95),
    component("delivery", 15, 80),
    component("workforce", 10, 90),
  ]);
  assert.equal(result.score, 88);
});

test("not-applicable KPI weight redistributes across eligible components", () => {
  const result = calculateWeightedKpi([
    component("planning", 25, 90),
    component("productivity", 30, null),
    component("quality", 20, 95),
    component("delivery", 15, 80),
    component("workforce", 10, 90),
  ]);
  assert.equal(result.eligibleWeight, 70);
  assert.equal(result.score, 90);
  assert.equal(result.components[1]?.weightedScore, null);
});
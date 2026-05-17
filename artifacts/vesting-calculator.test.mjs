import assert from "node:assert/strict";
import test from "node:test";
import { buildSchedule, describeSchedule, vestedAmount } from "./vesting-calculator.mjs";

test("AC-001: no tokens vest before cliff", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 5 }), 0);
});

test("AC-002: halfway through vesting equals half allocation", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 18 }), 900_000);
});

test("AC-003: after vesting end, full allocation is vested", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 30 }), 1_800_000);
});

test("AC-004: schedule exposes month, vested, and percent fields", () => {
  const [first] = buildSchedule({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24 });
  assert.deepEqual(Object.keys(first).sort(), ["month", "percentVested", "vested"]);
});

test("AC-004: text output is founder-readable", () => {
  const text = describeSchedule({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24 });
  assert.match(text, /Month 18: 900000 tokens vested \(50%\)/);
});

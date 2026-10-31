import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlan,
  risk,
  summarize,
  restorePlan,
  validateResult,
  exportCSV,
} from "../web/coverage-model.js";
const criterion = "Valid customers can view their own orders.";

test("criteria have bounded, unique traceable test cases", () => {
  const plan = buildPlan(criterion + "\nInvalid customers cannot sign in.");
  assert.equal(plan.requirements.length, 2);
  assert.equal(
    new Set(plan.requirements.flatMap((r) => r.cases.map((c) => c.id))).size,
    6,
  );
  assert.deepEqual(
    plan.requirements[0].cases.map((c) => c.category),
    ["Positive", "Negative", "Boundary"],
  );
  for (const invalid of [
    null,
    "short",
    criterion + "\n" + criterion.toUpperCase(),
    "x".repeat(251),
    Array.from({ length: 13 }, (_, i) => `${criterion} ${i}`).join("\n"),
  ])
    assert.throws(() => buildPlan(invalid));
});
test("risk thresholds match documented impact times likelihood", () => {
  for (const [impact, likelihood, label] of [
    [1, 5, "Low"],
    [2, 4, "Medium"],
    [3, 5, "High"],
    [5, 5, "High"],
  ])
    assert.equal(risk({ impact, likelihood }).label, label);
});
test("review alone never counts as executed or passing evidence", () => {
  const plan = buildPlan(criterion),
    requirement = plan.requirements[0];
  requirement.impact = 5;
  requirement.cases.forEach((c) => {
    c.reviewed = true;
  });
  assert.equal(summarize(plan).reviewed, 3);
  assert.equal(summarize(plan).passed, 0);
  assert.deepEqual(summarize(plan).highRiskGaps, ["AC-1"]);
  requirement.cases.forEach((c) => {
    c.status = "passed";
    c.evidence = "Observed expected behavior in local demo.";
  });
  assert.equal(summarize(plan).complete, true);
  assert.equal(summarize(plan).highRiskGaps.length, 0);
  requirement.cases[0].status = "failed";
  assert.equal(summarize(plan).failed, 1);
  assert.equal(summarize(plan).complete, false);
});
test("manual outcomes require evidence and reject unknown states", () => {
  for (const status of ["passed", "failed", "blocked"])
    assert.throws(() => validateResult(status, "  "), /evidence/);
  assert.throws(() => validateResult("magic", "Observed"));
  assert.throws(() => validateResult("passed", "x".repeat(1001)));
  validateResult("not-run", "");
  validateResult("passed", "Trace ABC records expected result.");
});
test("CSV quotes delimiters and neutralizes spreadsheet formulas", () => {
  const plan = buildPlan('=HYPERLINK("https://example.test")');
  plan.requirements[0].cases[0].evidence = '+SUM(1,2)\nquoted "text"';
  const csv = exportCSV(plan);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\+SUM/);
  assert.match(csv, /quoted ""text""/);
});
test("restoration rejects malformed saved results and reconstructs canonical IDs", () => {
  const plan = buildPlan(criterion);
  plan.requirements[0].id = "tampered";
  assert.equal(restorePlan(plan).requirements[0].id, "AC-1");
  plan.requirements[0].cases[0].status = "passed";
  assert.throws(() => restorePlan(plan), /evidence/);
  plan.requirements[0].cases[0].evidence = "Expected outcome observed";
  plan.requirements[0].impact = 7;
  assert.throws(() => restorePlan(plan));
});

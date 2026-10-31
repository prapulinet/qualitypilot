import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBug, bugText } from "../web/bug-model.js";
const issue =
  "Save shows success but the updated value disappears after refresh.";
test("a short observation becomes a draft without fabricated reproduction or expected behavior", () => {
  const bug = buildBug({ issue });
  const text = bugText(bug);
  assert.equal(bug.actual, issue);
  assert.equal(bug.source, "local-template");
  assert.equal(bug.reviewRequired, true);
  assert.equal(bug.steps.length, 0);
  assert.equal(bug.missing.length, 6);
  assert.match(text, /Needs confirmation: expected behavior/);
  assert.match(text, /No root cause has been established/);
  assert.equal(bug.severity, "Not assessed");
});
test("provided facts and numbered steps are preserved in a copyable report", () => {
  const bug = buildBug({
    issue,
    title: "Profile changes lost after refresh",
    steps: "1. Edit name\n2) Save\n3. Refresh",
    expected: "Saved name remains after refresh.",
    actual: "Old name returns.",
    environment: "Chrome / QA build 12",
    evidence: "profile-refresh.png",
    frequency: "Every attempt",
    severity: "Major",
    story: "QA-123",
  });
  assert.equal(bug.missing.length, 0);
  assert.deepEqual(bug.steps, ["Edit name", "Save", "Refresh"]);
  const text = bugText(bug);
  assert.match(text, /Saved name remains/);
  assert.match(text, /3\. Refresh/);
  assert.match(text, /QA-123/);
  assert.match(text, /To be determined in team triage/);
});
test("validation rejects invalid enums, field sizes and excessive steps", () => {
  for (const data of [
    { issue: "short" },
    { issue, expected: "x".repeat(2001) },
    { issue, severity: "urgent" },
    { issue, frequency: "always maybe" },
    { issue, steps: Array(21).fill("Click").join("\n") },
    { issue, environment: 12 },
  ])
    assert.throws(() => buildBug(data));
});
test("context questions are suggestions rather than invented observations", () => {
  const bug = buildBug({
    issue: "Login and payment submit validation are broken.",
  });
  assert.equal(bug.questions.length, 3);
  assert.equal(bug.actual, "Login and payment submit validation are broken.");
  assert.equal(bugText(bug).includes("operation persisted?"), false);
});
test("plain text preserves markup as user text and summary is bounded", () => {
  const bug = buildBug({
    issue: '<img src=x onerror="alert(1)"> ' + "x".repeat(200),
  });
  assert.equal(bug.summary.length, 120);
  assert.match(bugText(bug), /<img/);
});

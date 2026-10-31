import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspace,
  addRequirement,
  reviseRequirement,
  addCase,
  editCase,
  reviewCase,
  startRun,
  recordResult,
  linkDefect,
  bugDraft,
  closeDefect,
  reopenDefect,
  releaseSummary,
  releaseText,
  boundaryData,
  importWorkspaces,
  backup,
} from "../web/workspace-model.js";
function fixture() {
  const p = createWorkspace("Account release"),
    r = addRequirement(p, "Saved names remain after refresh.", 5, 4),
    c = addCase(p, {
      requirementId: r.id,
      title: "Persist name",
      steps: "Change name, save, refresh",
      expected: "New name remains",
    });
  return { p, r, c };
}
test("empty and untested projects never become release-ready", () => {
  const p = createWorkspace("Empty");
  assert.ok(releaseSummary(p).blockers.length);
  addRequirement(p, "Orders must belong to the current account.");
  assert.match(releaseSummary(p).blockers[0], /No test design/);
});
test("sessions require reviewed designs and explicit observed results/evidence", () => {
  const { p, c } = fixture();
  assert.throws(() => startRun(p, "Smoke"), /Review/);
  reviewCase(p, c.id);
  const run = startRun(p, "Smoke");
  assert.throws(
    () =>
      recordResult(p, run.id, c.id, {
        status: "passed",
        actual: "Correct",
        evidence: "",
      }),
    /Evidence/,
  );
  assert.equal(run.cases[0].status, "not-run");
  recordResult(p, run.id, c.id, {
    status: "passed",
    actual: "New name remained",
    evidence: "manual-001",
  });
  assert.equal(releaseSummary(p).blockers.length, 0);
  assert.match(releaseText(p), /Human sign-off/);
});
test("requirement revisions invalidate old coverage without rewriting session snapshots", () => {
  const { p, r, c } = fixture();
  reviewCase(p, c.id);
  const run = startRun(p, "Before change");
  recordResult(p, run.id, c.id, {
    status: "passed",
    actual: "Observed",
    evidence: "trace-1",
  });
  const snapshot = structuredClone(run.cases[0]);
  reviseRequirement(
    p,
    r.id,
    "Saved names remain after logout and sign-in.",
    5,
    4,
  );
  assert.deepEqual(run.cases[0], snapshot);
  assert.ok(
    releaseSummary(p).blockers.some((b) => b.startsWith("Design review")),
  );
  reviewCase(p, c.id);
  assert.ok(
    releaseSummary(p).blockers.some((b) => b.startsWith("High-risk gap")),
  );
});
test("case edits require new approval and invalidate older execution versions", () => {
  const { p, c } = fixture();
  reviewCase(p, c.id);
  const run = startRun(p, "v1");
  recordResult(p, run.id, c.id, {
    status: "passed",
    actual: "Observed",
    evidence: "trace",
  });
  editCase(p, c.id, {
    title: c.title,
    steps: c.steps,
    expected: "Name remains after logout too",
  });
  assert.equal(c.version, 2);
  assert.equal(c.reviewedRevision, 0);
  assert.equal(run.cases[0].expected, "New name remains");
  reviewCase(p, c.id);
  assert.ok(releaseSummary(p).blockers.length);
});
test("defect closure requires a newer passing retest against the current design", () => {
  const { p, c } = fixture();
  reviewCase(p, c.id);
  const first = startRun(p, "Initial");
  recordResult(p, first.id, c.id, {
    status: "failed",
    actual: "Old name returned",
    evidence: "failure-001",
  });
  const defect = linkDefect(p, first.id, c.id, {
    title: "Saved name lost",
    severity: "Major",
  });
  const draft = bugDraft(p, first.id, c.id, "x".repeat(160));
  assert.equal(draft.title.length, 120);
  assert.equal(draft.actual, "Old name returned");
  assert.equal(draft.expected, c.expected);
  assert.throws(() => closeDefect(p, defect.id, first.id), /newer/);
  const retest = startRun(p, "Retest");
  assert.throws(() => closeDefect(p, defect.id, retest.id), /passing retest/);
  recordResult(p, retest.id, c.id, {
    status: "passed",
    actual: "New name remained",
    evidence: "retest-002",
  });
  assert.ok(releaseSummary(p).blockers.some((b) => b.startsWith("Open major")));
  closeDefect(p, defect.id, retest.id);
  assert.equal(releaseSummary(p).blockers.length, 0);
  assert.deepEqual(importWorkspaces(backup([p])), [p]);
  assert.throws(
    () =>
      recordResult(p, retest.id, c.id, {
        status: "failed",
        actual: "Correction",
        evidence: "Correction evidence",
      }),
    /closed defect/,
  );
  reopenDefect(p, defect.id);
  assert.ok(releaseSummary(p).blockers.some((b) => b.startsWith("Open major")));
});
test("stale retest cannot close a defect and nonfailed results cannot create defects", () => {
  const { p, r, c } = fixture();
  reviewCase(p, c.id);
  const first = startRun(p, "Initial");
  assert.throws(
    () =>
      linkDefect(p, first.id, c.id, { title: "Invalid", severity: "Major" }),
    /failed/,
  );
  recordResult(p, first.id, c.id, {
    status: "failed",
    actual: "Wrong",
    evidence: "failure",
  });
  const defect = linkDefect(p, first.id, c.id, {
    title: "Issue",
    severity: "Critical",
  });
  const retest = startRun(p, "Retest");
  recordResult(p, retest.id, c.id, {
    status: "passed",
    actual: "Correct",
    evidence: "success",
  });
  reviseRequirement(
    p,
    r.id,
    "Changed acceptance criterion after retesting.",
    4,
    4,
  );
  assert.throws(() => closeDefect(p, defect.id, retest.id), /current reviewed/);
});
test("backup round trip preserves traceability and rejects invalid links atomically", () => {
  const { p, c } = fixture();
  reviewCase(p, c.id);
  const run = startRun(p, "Recorded");
  recordResult(p, run.id, c.id, {
    status: "passed",
    actual: "Correct",
    evidence: "example",
  });
  assert.deepEqual(importWorkspaces(backup([p])), [p]);
  const invalid = JSON.parse(backup([p]));
  invalid.projects[0].cases[0].requirementId = "missing";
  assert.throws(() => importWorkspaces(JSON.stringify(invalid)), /not found/);
  assert.equal(p.cases[0].requirementId, p.requirements[0].id);
  assert.throws(
    () => importWorkspaces(JSON.stringify({ version: 99, projects: [] })),
    /Unsupported/,
  );
  assert.throws(() => importWorkspaces("x".repeat(2097153)), /2 MB/);
  assert.throws(() => backup([{ name: "🚀".repeat(600000) }]), /2 MB/);
});
test("backup import rejects duplicate IDs, malformed outcomes and invalid risk", () => {
  const { p, c } = fixture();
  const duplicate = JSON.parse(backup([p, p]));
  assert.throws(() => importWorkspaces(JSON.stringify(duplicate)), /Duplicate/);
  reviewCase(p, c.id);
  const run = startRun(p, "Test");
  const invalid = JSON.parse(backup([p]));
  invalid.projects[0].runs[0].cases[0].status = "passed";
  assert.throws(() => importWorkspaces(JSON.stringify(invalid)), /Actual/);
  p.requirements[0].impact = 9;
  assert.throws(() => importWorkspaces(backup([p])), /impact/);
});
test("boundary assistant is deterministic for equal, negative and inverted ranges", () => {
  assert.deepEqual(
    boundaryData(8, 20).map((r) => r.value),
    [7, 8, 9, 19, 20, 21],
  );
  assert.deepEqual(
    boundaryData(0, 0).map((r) => r.value),
    [-1, 0, 1],
  );
  assert.equal(
    boundaryData(-5, -2).find((r) => r.value === -5).expected,
    "Within inclusive range",
  );
  assert.throws(() => boundaryData(5, 1));
  assert.throws(() => boundaryData(1.5, 2));
});
test("imported planning placeholders cannot be approved as finished design", () => {
  const { p, c } = fixture();
  editCase(p, c.id, {
    title: c.title,
    steps: c.steps,
    expected: "[NEEDS CONFIRMATION] Define the expected outcome",
  });
  assert.throws(() => reviewCase(p, c.id), /clarification/);
});

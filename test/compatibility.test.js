import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMatrix,
  addEnvironment,
  addJourney,
  recordMatrix,
  matrixSummary,
  matrixBackup,
  restoreMatrix,
} from "../web/compatibility-model.js";
test("compatibility records require context and evidence; invalid mutations preserve existing results", () => {
  const m = createMatrix("Synthetic checkout");
  addEnvironment(m, {
    name: "Staging",
    build: "B1",
    browser: "Chrome / Windows",
  });
  addJourney(m, {
    name: "Checkout",
    expected: "An order reference is visible",
  });
  assert.equal(matrixSummary(m).notRun, 1);
  assert.throws(() =>
    recordMatrix(m, "E-1", "J-1", {
      status: "passed",
      actual: "Reference visible",
      evidence: "",
    }),
  );
  assert.equal(m.records.length, 0);
  recordMatrix(m, "E-1", "J-1", {
    status: "failed",
    actual: "Synthetic reference missing",
    evidence: "Synthetic capture 01",
  });
  const prior = matrixBackup(m);
  assert.throws(() =>
    addEnvironment(m, {
      name: "Staging",
      build: "B1",
      browser: "Chrome / Windows",
    }),
  );
  assert.equal(matrixBackup(m), prior);
  addEnvironment(m, {
    name: "Staging",
    build: "B2",
    browser: "Chrome / Windows",
  });
  assert.equal(matrixSummary(m).notRun, 1);
  assert.equal(matrixSummary(m).failed, 1);
  recordMatrix(m, "E-2", "J-1", {
    status: "not-applicable",
    actual: "Excluded by the agreed synthetic support matrix",
    evidence: "",
  });
  assert.equal(matrixSummary(m)["not-applicable"], 1);
  assert.deepEqual(restoreMatrix(matrixBackup(m)), m);
  const corrupt = JSON.parse(matrixBackup(m));
  corrupt.records[0].journeyId = "J-99";
  assert.throws(() => restoreMatrix(JSON.stringify(corrupt)));
});
test("compatibility dimensions and UTF8 budget are bounded transactionally", () => {
  const m = createMatrix("Synthetic boundary review");
  for (let i = 0; i < 8; i++) {
    addEnvironment(m, {
      name: "Test",
      build: `B${i}`,
      browser: "Synthetic browser",
    });
    addJourney(m, {
      name: `Journey ${i}`,
      expected: "Confirmed synthetic result",
    });
  }
  assert.throws(() =>
    addJourney(m, { name: "Ninth journey", expected: "A result" }),
  );
  assert.equal(m.journeys.length, 8);
  let reached = false;
  for (const e of m.environments) {
    for (const j of m.journeys) {
      const before = matrixBackup(m);
      try {
        recordMatrix(m, e.id, j.id, {
          status: "passed",
          actual: "🙂".repeat(1000),
          evidence: "synthetic evidence",
        });
      } catch (error) {
        assert.match(error.message, /budget/);
        assert.equal(matrixBackup(m), before);
        reached = true;
        break;
      }
    }
    if (reached) break;
  }
  assert.equal(reached, true);
  assert.throws(() => restoreMatrix("x".repeat(256 * 1024 + 1)));
  assert.throws(() =>
    addJourney(createMatrix("X"), {
      name: "Unknown",
      expected: "[NEEDS CONFIRMATION] something",
    }),
  );
});

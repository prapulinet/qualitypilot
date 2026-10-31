import { test } from "node:test";
import assert from "node:assert/strict";
import {
  storyReview,
  dataExamples,
  csv,
  selectRegression,
  playwrightResults,
  normalizeResults,
  compareResults,
} from "../web/daily-model.js";

test("story review exposes missing answers without inventing acceptance criteria", () => {
  const review = storyReview({
    story: "Customer submits a shopping order",
    criteria: "An order number is displayed",
  });
  assert.equal(review.unanswered, 5);
  assert.equal(review.sections[0].answer, "An order number is displayed");
  assert.equal(review.sections[1].answer, "");
  assert.throws(() => storyReview({ story: "short" }));
});
test("data builder handles collapsed ranges, text boundaries and unconfirmed probes", () => {
  const rows = dataExamples({ kind: "integer", min: "1", max: "1" });
  assert.deepEqual(
    rows.slice(0, 3).map((r) => r.value),
    [0, 1, 2],
  );
  const text = dataExamples({ kind: "text", min: 0, max: 2 });
  assert.deepEqual(
    text.slice(0, 4).map((r) => r.value.length),
    [0, 1, 2, 3],
  );
  assert.throws(() => dataExamples({ kind: "text", min: 0, max: 257 }));
  assert.throws(() => dataExamples({ kind: "integer", min: "", max: 5 }));
  assert.match(csv([["=1+1", 'a"b', "\t@cmd"]]), /"'=1\+1","a""b","'\t@cmd"/);
});
test("regression selection uses complete exact tags and rejects duplicate identities", () => {
  const cases = [
    {
      id: "a",
      title: "Checkout",
      modules: ["checkout"],
      dependencies: ["Session"],
    },
    { id: "b", title: "Search", modules: ["search"], dependencies: [] },
  ];
  assert.deepEqual(
    selectRegression(cases, "SESSION").map((c) => c.selected),
    [true, false],
  );
  assert.deepEqual(
    selectRegression(cases, "check").map((c) => c.selected),
    [false, false],
  );
  assert.throws(() => selectRegression([cases[0], cases[0]], "checkout"));
  assert.throws(() => selectRegression(cases, ""));
});
test("Playwright importer preserves retries and expected failures and compares identities", () => {
  const report = {
    suites: [
      {
        title: "suite",
        file: "a.spec.js",
        specs: [
          {
            title: "retry",
            tests: [
              {
                projectName: "chromium",
                expectedStatus: "passed",
                results: [
                  {
                    status: "failed",
                    duration: 10,
                    errors: [{ message: "first failure" }],
                  },
                  { status: "passed", duration: 20 },
                ],
              },
            ],
          },
          {
            title: "known failure",
            tests: [
              {
                expectedStatus: "failed",
                results: [{ status: "failed", duration: 5 }],
              },
            ],
          },
        ],
      },
    ],
  };
  const rows = playwrightResults(report);
  assert.equal(rows[0].status, "flaky");
  assert.equal(rows[0].retries, 1);
  assert.equal(rows[0].duration, 30);
  assert.equal(rows[1].status, "passed");
  assert.equal(
    compareResults([{ ...rows[0], status: "passed" }], rows)[0].change,
    "flaky → passed",
  );
  assert.throws(() =>
    playwrightResults({ ...report, errors: [{ message: "setup failed" }] }),
  );
  assert.throws(() => normalizeResults([rows[0], rows[0]]));
  assert.throws(() => normalizeResults([{ ...rows[0], duration: -1 }]));
});

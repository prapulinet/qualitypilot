import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  campaign,
  decisionRows,
  decisionProject,
  parseJSON,
  resolvePointer,
  contractSuite,
  checkContract,
  contractJUnit,
  HEALTH_CONTRACT,
} from "../web/sdet-model.js";
import { importWorkspaces, reviewCase } from "../web/workspace-model.js";
const record = {
  status: 200,
  durationMs: 5,
  headers: { "Content-Type": "application/json" },
  body: { status: "ok", aiConfigured: false },
};
test("campaigns preserve criteria and cannot auto-approve generated expectations", () => {
  const pack = campaign({
    name: "Checkout",
    profile: "checkout",
    criteria: "Cart is empty after checkout\nAn order reference is visible",
  });
  const [p] = importWorkspaces(pack.backup);
  assert.equal(p.requirements.length, 2);
  assert.equal(p.cases.length, 8);
  assert.equal(p.runs.length, 0);
  assert.throws(() => reviewCase(p, p.cases[0].id), /placeholder/);
  assert.equal(p.cases[0].reviewedRevision, 0);
  assert.throws(() =>
    campaign({ name: "X", profile: "api", criteria: "one\none" }),
  );
  assert.throws(() =>
    campaign({ name: "X", profile: "unsupported", criteria: "one" }),
  );
});
test("decision tables enumerate binary combinations and require explicit outcomes or exclusions", () => {
  const rows = decisionRows("Signed in\nHas stock");
  assert.equal(rows.length, 4);
  assert.deepEqual(
    rows.map((r) => r.conditions.map((c) => c.value)),
    [
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ],
  );
  assert.throws(
    () => decisionProject("Decision", "An agreed business rule", rows),
    /Expected behavior/,
  );
  rows.forEach((r) => (r.expected = "Confirmed synthetic rule outcome"));
  rows[0].disposition = "exclude";
  assert.throws(
    () => decisionProject("Decision", "An agreed business rule", rows),
    /Exclusion reason/,
  );
  rows[0].reason = "Synthetic precondition excludes this combination";
  assert.equal(
    importWorkspaces(
      decisionProject("Decision", "An agreed business rule", rows),
    )[0].cases.length,
    3,
  );
  assert.throws(() => decisionRows("Name\nname"));
  assert.throws(() => decisionRows("a\nb\nc\nd\ne\nf"));
});
test("JSON Pointer handles escaped keys, own fields, null and strict array indices", () => {
  const value = JSON.parse(
    '{"a/b":{"~key":[null,false]},"__proto__":{"safe":true}}',
  );
  assert.deepEqual(resolvePointer(value, "/a~1b/~0key/0"), {
    found: true,
    value: null,
  });
  assert.equal(resolvePointer(value, "/a~1b/~0key/1").value, false);
  assert.equal(resolvePointer(value, "/a~1b/~0key/01").found, false);
  assert.equal(resolvePointer({}, "/toString").found, false);
  assert.equal(resolvePointer(value, "/__proto__/safe").value, true);
  assert.throws(() => resolvePointer(value, "/bad~2key"));
  assert.throws(() => resolvePointer(value, "#/a"));
});
test("contract assertions distinguish missing fields, false, structural equality and mismatched types", () => {
  assert.equal(checkContract(HEALTH_CONTRACT, record).passed, true);
  const suite = {
    version: 1,
    name: "Typed rules",
    rules: [
      {
        name: "False remains false",
        path: "/body/aiConfigured",
        op: "equals",
        expected: false,
      },
      { name: "Missing is absent", path: "/body/missing", op: "absent" },
      {
        name: "Object ordering",
        path: "/body",
        op: "equals",
        expected: { aiConfigured: false, status: "ok" },
      },
      {
        name: "Duration maximum",
        path: "/durationMs",
        op: "max",
        expected: 10,
      },
      { name: "Text length", path: "/body/status", op: "length", expected: 2 },
    ],
  };
  assert.equal(checkContract(suite, record).passed, true);
  suite.rules[0].expected = "false";
  assert.equal(checkContract(suite, record).passed, false);
  assert.throws(() =>
    contractSuite({
      ...HEALTH_CONTRACT,
      rules: [{ ...HEALTH_CONTRACT.rules[0], ope: "typo" }],
    }),
  );
  assert.throws(() => contractSuite({ ...HEALTH_CONTRACT, rules: [] }));
  assert.throws(() =>
    checkContract(HEALTH_CONTRACT, { ...record, durationMs: -1 }),
  );
  assert.throws(() =>
    checkContract(HEALTH_CONTRACT, { ...record, body: { value: Infinity } }),
  );
});
test("contract import bounds and JUnit escaping prevent misleading or broken reports", () => {
  assert.throws(() => parseJSON("not JSON"));
  assert.throws(() => parseJSON(" ".repeat(1024 * 1024 + 1)));
  const suite = {
    version: 1,
    name: '<suite & "x">',
    rules: [
      {
        name: "rule <one>",
        path: "/body/status",
        op: "equals",
        expected: "incorrect & <expected>",
      },
    ],
  };
  const report = checkContract(suite, record);
  const junit = contractJUnit(report);
  assert.match(junit, /failures="1"/);
  assert.match(junit, /&lt;suite &amp; &quot;x&quot;&gt;/);
  assert.match(junit, /&lt;expected&gt;/);
  let body = {};
  for (let i = 0; i < 32; i++) body = { nested: body };
  assert.throws(
    () => checkContract(HEALTH_CONTRACT, { ...record, body }),
    /nesting/,
  );
});
test("CLI returns nonzero on failed assertions or invalid input and writes consumable JUnit", () => {
  const dir = mkdtempSync(join(tmpdir(), "qualitypilot-contract-")),
    suite = join(dir, "suite.json"),
    response = join(dir, "response.json"),
    out = join(dir, "results.xml");
  try {
    writeFileSync(suite, JSON.stringify(HEALTH_CONTRACT));
    writeFileSync(response, JSON.stringify(record));
    const run = () =>
      spawnSync(
        process.execPath,
        ["tools/check-contract.js", suite, response, "--junit", out],
        { encoding: "utf8" },
      );
    assert.equal(run().status, 0);
    assert.match(readFileSync(out, "utf8"), /failures="0"/);
    writeFileSync(response, JSON.stringify({ ...record, status: 500 }));
    assert.equal(run().status, 1);
    assert.match(readFileSync(out, "utf8"), /failures="1"/);
    writeFileSync(response, "invalid");
    assert.equal(run().status, 2);
    assert.match(readFileSync(out, "utf8"), /Input validation failed/);
  } finally {
    for (const path of [suite, response, out]) {
      try {
        unlinkSync(path);
      } catch {}
    }
    rmdirSync(dir);
  }
});

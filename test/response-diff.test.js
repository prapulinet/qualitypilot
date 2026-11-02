import test from "node:test";
import assert from "node:assert/strict";
import { compareResponses } from "../web/response-diff-model.js";

test("response comparison distinguishes missing/null/types and escaped own keys", () => {
  const before =
    '{"gone":null,"kind":1,"a/b":{"~key":true},"items":[1,2],"__proto__":1}';
  const after =
    '{"new":null,"kind":"1","a/b":{"~key":false},"items":[2],"__proto__":2}';
  const report = compareResponses(before, after);
  const at = (path) => report.changes.find((c) => c.path === path);
  assert.equal(at("/gone").kind, "removed");
  assert.equal(at("/gone").before, null);
  assert.equal(Object.hasOwn(at("/gone"), "after"), false);
  assert.equal(at("/new").kind, "added");
  assert.equal(at("/kind").kind, "type changed");
  assert.equal(at("/a~1b/~0key").after, false);
  assert.equal(at("/items/1").kind, "removed");
  assert.equal(at("/__proto__").after, 2);
  assert.equal(
    compareResponses('{"a":1,"b":2}', '{"b":2,"a":1}').changes.length,
    0,
  );
  assert.equal(compareResponses("null", "[]").changes[0].path, "");
});

test("response comparison keeps ignores explicit and rejects over-limit/invalid results", () => {
  const r = compareResponses(
    '{"meta":{"time":1},"value":1}',
    '{"meta":{"time":2},"value":2}',
    "/meta\n/missing\n/meta",
  );
  assert.deepEqual(r.matchedIgnoredPaths, ["/meta"]);
  assert.deepEqual(r.unmatchedIgnoredPaths, ["/missing"]);
  assert.deepEqual(
    r.changes.map((c) => c.path),
    ["/value"],
  );
  for (const args of [
    ["bad", "{}"],
    ["1e400", "0"],
    ["{}", "{}", "/bad~2"],
    ["{}", "{}", "root"],
    ['"' + "x".repeat(262144) + '"', "0"],
    ["[".repeat(42) + "0" + "]".repeat(42), "0"],
    [JSON.stringify(Array(501).fill(0)), JSON.stringify(Array(501).fill(1))],
    [JSON.stringify(Array(20000).fill(0)), "0"],
  ])
    assert.throws(() => compareResponses(...args));
});

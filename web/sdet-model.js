import {
  createWorkspace,
  addRequirement,
  addCase,
  backup,
} from "./workspace-model.js";

function required(value, label, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
export const PROFILES = {
  general: {
    label: "General web feature",
    questions: [
      "Which user roles and starting states are in scope?",
      "What are the confirmed limits and error messages?",
      "What happens on retry, refresh and interrupted work?",
    ],
    actions: [
      "Complete the agreed primary journey using valid data.",
      "Try an agreed invalid input or disallowed action.",
      "Exercise confirmed limits and state transitions.",
      "Interrupt, retry or refresh at an agreed recovery point.",
    ],
  },
  account: {
    label: "Account and permissions",
    questions: [
      "Which role may read or change each record?",
      "What are the agreed sign-out and expiry rules?",
      "Which safe test identities and ownership states are available?",
    ],
    actions: [
      "Complete the agreed account workflow with a permitted identity.",
      "Try the same action with a disallowed role or owned-by-another test record.",
      "Check confirmed session expiry and input-length boundaries.",
      "Check sign-out, stale pages and retry behavior against agreed rules.",
    ],
  },
  checkout: {
    label: "Commerce and checkout",
    questions: [
      "How are totals, currency, quantity limits and rounding defined?",
      "What identifies a duplicate order or payment retry?",
      "What should happen if cart, stock or session state changes?",
    ],
    actions: [
      "Complete the agreed cart-to-confirmation journey with valid test data.",
      "Try an agreed invalid item, quantity or expired session.",
      "Check confirmed quantity and amount boundaries.",
      "Check duplicate submission and interrupted confirmation against agreed recovery rules.",
    ],
  },
  upload: {
    label: "Files and uploads",
    questions: [
      "Which file types, sizes and filename rules are confirmed?",
      "How are duplicates, cancellation and partial uploads handled?",
      "Who may access a stored file, and how long is it retained?",
    ],
    actions: [
      "Upload an allowed synthetic file and verify its agreed downstream behavior.",
      "Try an agreed disallowed type or unauthorized file access.",
      "Check confirmed empty-file, size and filename boundaries.",
      "Check cancellation, interruption and retry against agreed rules.",
    ],
  },
  api: {
    label: "API and integrations",
    questions: [
      "Which contract version, status codes and response types are agreed?",
      "What are the identity, ownership and rate-limit rules?",
      "What are the timeout, retry and duplicate-processing rules?",
    ],
    actions: [
      "Check the agreed success response and downstream state.",
      "Check agreed invalid-input and permission rejections.",
      "Check confirmed payload and pagination boundaries.",
      "Check timeout, retry and duplicate-processing outcomes against agreed rules.",
    ],
  },
};
export function campaign(input) {
  const name = required(input.name, "Feature name", 80),
    profile = PROFILES[input.profile];
  if (!profile) throw Error("Choose a supported feature profile.");
  const criteria = required(input.criteria, "Acceptance criteria", 5000)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !criteria.length ||
    criteria.length > 8 ||
    criteria.some((s) => s.length > 500) ||
    new Set(criteria).size !== criteria.length
  )
    throw Error("Enter 1 to 8 distinct criteria, up to 500 characters each.");
  const project = createWorkspace(name),
    categories = ["Positive", "Negative", "Boundary", "Recovery"];
  for (const criterion of criteria) {
    const r = addRequirement(project, criterion);
    profile.actions.forEach((action, i) =>
      addCase(project, {
        requirementId: r.id,
        title: `${categories[i]}: ${criterion}`.slice(0, 160),
        steps: `Criterion: ${criterion}\n${action}\nSpecify safe data, prerequisites and exact reproduction steps before reviewing.`,
        expected: `[NEEDS CONFIRMATION] Define the ${categories[i].toLowerCase()} expected behavior from the approved rule: ${criterion}`,
      }),
    );
  }
  return {
    project,
    questions: profile.questions,
    profile: profile.label,
    backup: backup([project]),
  };
}
export function decisionRows(source) {
  const names = required(source, "Conditions", 1000)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !names.length ||
    names.length > 5 ||
    names.some((s) => s.length > 100) ||
    new Set(names.map((s) => s.toLowerCase())).size !== names.length
  )
    throw Error(
      "Supply 1 to 5 distinct binary conditions, up to 100 characters each.",
    );
  return Array.from({ length: 2 ** names.length }, (_, index) => ({
    id: `R-${index + 1}`,
    conditions: names.map((name, i) => ({
      name,
      value: Boolean(index & (1 << (names.length - i - 1))),
    })),
    expected: "",
    disposition: "test",
    reason: "",
  }));
}
export function decisionProject(name, criterion, rows) {
  required(criterion, "Decision acceptance criterion", 500);
  if (!Array.isArray(rows) || !rows.length || rows.length > 32)
    throw Error("Generate a decision table first.");
  const project = createWorkspace(required(name, "Decision feature name", 80)),
    r = addRequirement(project, criterion);
  let included = 0;
  for (const row of rows) {
    if (!["test", "exclude"].includes(row.disposition))
      throw Error("Choose test or exclude for each row.");
    if (row.disposition === "exclude") {
      required(row.reason, "Exclusion reason", 500);
      continue;
    }
    if (
      !Array.isArray(row.conditions) ||
      !row.conditions.length ||
      row.conditions.length > 5
    )
      throw Error("Invalid condition row.");
    const steps = row.conditions
      .map((c) => {
        if (typeof c.value !== "boolean")
          throw Error("Conditions must be true or false.");
        return `${required(c.name, "Condition", 100)}: ${c.value ? "True" : "False"}`;
      })
      .join("\n");
    const expected = required(
      row.expected,
      `Expected behavior for ${row.id}`,
      2000,
    );
    if (expected.includes("[NEEDS CONFIRMATION]"))
      throw Error("Confirm each included row's expected behavior.");
    addCase(project, {
      requirementId: r.id,
      title: `Decision ${required(row.id, "Row ID", 40)}`,
      steps: `Arrange these confirmed conditions:\n${steps}\nExecute the feature and observe the agreed outcome.`,
      expected,
    });
    included++;
  }
  if (!included) throw Error("Include at least one executable row.");
  return backup([project]);
}

export function parseJSON(source, label = "JSON") {
  if (
    typeof source !== "string" ||
    new TextEncoder().encode(source).length > 1024 * 1024
  )
    throw Error(`${label} exceeds 1 MB.`);
  try {
    return JSON.parse(source.replace(/^\uFEFF/, ""));
  } catch {
    throw Error(`${label} is not valid JSON.`);
  }
}
function pointerTokens(path) {
  if (
    typeof path !== "string" ||
    path.length > 500 ||
    (path !== "" && !path.startsWith("/")) ||
    /~(?:[^01]|$)/.test(path)
  )
    throw Error(
      "Use JSON Pointer paths such as /body/items/0/id; escape ~ as ~0 and / as ~1.",
    );
  return path === ""
    ? []
    : path
        .slice(1)
        .split("/")
        .map((t) => t.replaceAll("~1", "/").replaceAll("~0", "~"));
}
export function resolvePointer(value, path) {
  for (const token of pointerTokens(path)) {
    if (
      value === null ||
      typeof value !== "object" ||
      !Object.hasOwn(value, token) ||
      (Array.isArray(value) &&
        (!/^(0|[1-9]\d*)$/.test(token) || Number(token) >= value.length))
    )
      return { found: false };
    value = value[token];
  }
  return { found: true, value };
}
function equal(a, b) {
  if (a === b) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]))
  );
}
function jsonDepth(value, depth = 0) {
  if (typeof value === "number" && !Number.isFinite(value))
    throw Error("Use finite JSON numbers.");
  if (depth > 30) throw Error("JSON nesting exceeds 30 levels.");
  if (value && typeof value === "object")
    for (const v of Object.values(value)) jsonDepth(v, depth + 1);
}
export function contractSuite(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.rules) ||
    !input.rules.length ||
    input.rules.length > 50
  )
    throw Error("A version 1 contract suite needs 1 to 50 rules.");
  jsonDepth(input);
  const ids = new Set();
  const rules = input.rules.map((rule) => {
    if (
      !rule ||
      Object.keys(rule).some(
        (k) => !["name", "path", "op", "expected"].includes(k),
      )
    )
      throw Error("Unknown contract rule fields.");
    const name = required(rule.name, "Rule name", 100);
    if (ids.has(name)) throw Error("Rule names must be unique.");
    ids.add(name);
    pointerTokens(rule.path);
    const op = rule.op;
    if (
      ![
        "equals",
        "type",
        "exists",
        "absent",
        "min",
        "max",
        "length",
        "includes",
      ].includes(op)
    )
      throw Error("Unsupported contract operator.");
    if (!["exists", "absent"].includes(op) && !Object.hasOwn(rule, "expected"))
      throw Error("This operator needs an expected value.");
    if (
      op === "type" &&
      ![
        "string",
        "number",
        "integer",
        "boolean",
        "array",
        "object",
        "null",
      ].includes(rule.expected)
    )
      throw Error("Choose a supported JSON type.");
    if (["min", "max"].includes(op) && !Number.isFinite(rule.expected))
      throw Error("Numeric rules need finite expected numbers.");
    if (
      op === "length" &&
      (!Number.isSafeInteger(rule.expected) ||
        rule.expected < 0 ||
        rule.expected > 1000000)
    )
      throw Error("Length needs a non-negative integer up to 1000000.");
    return {
      name,
      path: rule.path,
      op,
      ...(["exists", "absent"].includes(op)
        ? {}
        : { expected: structuredClone(rule.expected) }),
    };
  });
  return { version: 1, name: required(input.name, "Suite name", 100), rules };
}
export function responseRecord(input) {
  if (
    !input ||
    !Number.isInteger(input.status) ||
    input.status < 100 ||
    input.status > 599 ||
    !Number.isFinite(input.durationMs) ||
    input.durationMs < 0 ||
    !input.headers ||
    typeof input.headers !== "object" ||
    Array.isArray(input.headers) ||
    !Object.hasOwn(input, "body")
  )
    throw Error(
      "Response needs status (100–599), non-negative durationMs, text headers and a JSON body.",
    );
  jsonDepth(input.body);
  const headers = {};
  for (const [key, value] of Object.entries(input.headers)) {
    if (
      typeof value !== "string" ||
      key.length > 200 ||
      value.length > 8000 ||
      Object.hasOwn(headers, key.toLowerCase())
    )
      throw Error("Use distinct text header names and values.");
    Object.defineProperty(headers, key.toLowerCase(), {
      value,
      enumerable: true,
    });
  }
  return {
    status: input.status,
    durationMs: input.durationMs,
    headers,
    body: structuredClone(input.body),
  };
}
export function checkContract(input, record) {
  const suite = contractSuite(input),
    response = responseRecord(record);
  const results = suite.rules.map((rule) => {
    const actual = resolvePointer(response, rule.path);
    let passed = false;
    if (rule.op === "exists") passed = actual.found;
    else if (rule.op === "absent") passed = !actual.found;
    else if (actual.found) {
      const a = actual.value,
        e = rule.expected;
      if (rule.op === "equals") passed = equal(a, e);
      if (rule.op === "type")
        passed =
          e === "null"
            ? a === null
            : e === "array"
              ? Array.isArray(a)
              : e === "integer"
                ? Number.isSafeInteger(a)
                : e === "object"
                  ? a !== null && typeof a === "object" && !Array.isArray(a)
                  : typeof a === e;
      if (rule.op === "min") passed = typeof a === "number" && a >= e;
      if (rule.op === "max") passed = typeof a === "number" && a <= e;
      if (rule.op === "length")
        passed = (typeof a === "string" || Array.isArray(a)) && a.length === e;
      if (rule.op === "includes")
        passed =
          typeof a === "string" && typeof e === "string"
            ? a.includes(e)
            : Array.isArray(a) && a.some((v) => equal(v, e));
    }
    return {
      ...rule,
      passed,
      actual: actual.found
        ? JSON.stringify(actual.value).slice(0, 600)
        : "[MISSING]",
    };
  });
  return { suite: suite.name, passed: results.every((r) => r.passed), results };
}
const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
export function contractJUnit(report) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="${xml(report.suite)}" tests="${report.results.length}" failures="${report.results.filter((r) => !r.passed).length}">${report.results.map((r) => `<testcase name="${xml(r.name)}" classname="QualityPilot.contract" time="0">${r.passed ? "" : `<failure message="Contract assertion failed">${xml(`${r.path} ${r.op}; expected ${JSON.stringify(r.expected)}; actual ${r.actual}`)}</failure>`}</testcase>`).join("")}</testsuite>\n`;
}
export const HEALTH_CONTRACT = {
  version: 1,
  name: "Local health contract",
  rules: [
    { name: "HTTP success", path: "/status", op: "equals", expected: 200 },
    {
      name: "JSON content type",
      path: "/headers/content-type",
      op: "includes",
      expected: "application/json",
    },
    {
      name: "Health status",
      path: "/body/status",
      op: "equals",
      expected: "ok",
    },
    {
      name: "AI configuration flag",
      path: "/body/aiConfigured",
      op: "type",
      expected: "boolean",
    },
  ],
};

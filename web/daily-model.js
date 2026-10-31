export const STORY_FIELDS = [
  [
    "criteria",
    "Acceptance criteria",
    "What observable behavior establishes success?",
  ],
  [
    "rules",
    "Limits and validation",
    "Which ranges, formats and required fields are confirmed?",
  ],
  [
    "roles",
    "Roles and permissions",
    "Who may perform this action, and who must be rejected?",
  ],
  [
    "data",
    "Test data and prerequisites",
    "Which safe accounts, states and data are required?",
  ],
  [
    "errors",
    "Errors and recovery",
    "What should happen on invalid input, timeout or retry?",
  ],
  [
    "dependencies",
    "Dependencies and end to end",
    "Which upstream and downstream journeys need checking?",
  ],
];

export function text(value, limit = 12000) {
  if (typeof value !== "string" || value.length > limit)
    throw Error(`Use text up to ${limit} characters.`);
  return value.trim();
}
export function storyReview(input) {
  const story = text(input.story);
  if (story.length < 10)
    throw Error("Describe the story in at least 10 characters.");
  const sections = STORY_FIELDS.map(([key, label, question]) => ({
    key,
    label,
    question,
    answer: text(input[key] || ""),
  }));
  return {
    story,
    sections,
    unanswered: sections.filter((s) => !s.answer).length,
    note: "Structured self-review only. Supplied answers are not independently validated or approved.",
  };
}
export function dataExamples({ kind, min, max }) {
  const lower = Number(min),
    upper = Number(max);
  if (
    String(min).trim() === "" ||
    String(max).trim() === "" ||
    !Number.isSafeInteger(lower) ||
    !Number.isSafeInteger(upper) ||
    lower > upper
  )
    throw Error("Supply ordered inclusive integer limits.");
  if (!["integer", "text"].includes(kind))
    throw Error("Choose integer or text length.");
  if (kind === "text" && (lower < 0 || upper > 256))
    throw Error("Text length must be between 0 and 256 UTF-16 code units.");
  if (kind === "integer" && (lower < -1000000 || upper > 1000000))
    throw Error("Integer limits must be between -1000000 and 1000000.");
  const lengths = [
    ...new Set([lower - 1, lower, lower + 1, upper - 1, upper, upper + 1]),
  ].sort((a, b) => a - b);
  const rows = lengths
    .filter((n) => kind === "integer" || n >= 0)
    .map((n) => ({
      purpose:
        kind === "integer" ? `Numeric boundary ${n}` : `ASCII length ${n}`,
      value: kind === "integer" ? n : "A".repeat(n),
      expectation:
        n >= lower && n <= upper
          ? "Within supplied range; verify other rules"
          : "Outside supplied range; verify rejection rule",
    }));
  return [
    ...rows,
    ...["", " ", "  sample  ", "é", "東京", "🙂", "1.5", "=1+1"].map(
      (value) => ({
        purpose: "Additional probe",
        value,
        expectation: "Confirm behavior from product rules; do not assume",
      }),
    ),
  ];
}
export function csv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let s = String(value ?? "");
          if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
          return `"${s.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
export function selectRegression(cases, changed) {
  if (!Array.isArray(cases) || !cases.length || cases.length > 500)
    throw Error("Supply 1 to 500 cases in a JSON array.");
  const tags = [
    ...new Set(
      text(changed, 1000)
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (!tags.length) throw Error("Enter at least one changed module tag.");
  const ids = new Set();
  return cases.map((c) => {
    if (!c || typeof c !== "object")
      throw Error("Each case must be an object.");
    const id = text(c.id, 100),
      title = text(c.title, 500);
    if (!id || !title || ids.has(id))
      throw Error("Cases require unique IDs and titles.");
    ids.add(id);
    for (const key of ["modules", "dependencies"]) {
      if (
        !Array.isArray(c[key]) ||
        c[key].length > 30 ||
        c[key].some((t) => typeof t !== "string" || !t.trim() || t.length > 100)
      )
        throw Error(
          "Each case requires modules and dependencies arrays of up to 30 text tags.",
        );
    }
    const matches = tags.filter((t) =>
      [...c.modules, ...c.dependencies].some(
        (v) => v.trim().toLowerCase() === t,
      ),
    );
    return {
      id,
      title,
      selected: matches.length > 0,
      reason: matches.length
        ? `Declared tag match: ${matches.join(", ")}`
        : "No declared tag match; inspect unmapped risk manually",
    };
  });
}
export function normalizeResults(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 2000)
    throw Error("Report must contain 1 to 2000 tests.");
  const ids = new Set();
  return rows.map((r) => {
    const id = text(r.id, 2000),
      title = text(r.title, 2000);
    if (!id || !title || ids.has(id))
      throw Error(
        "Report has missing or duplicate test identities; give tests distinct names.",
      );
    ids.add(id);
    if (
      !["passed", "failed", "skipped", "flaky"].includes(r.status) ||
      !Number.isFinite(r.duration) ||
      r.duration < 0 ||
      !Number.isInteger(r.retries) ||
      r.retries < 0
    )
      throw Error("Report contains invalid test results.");
    return {
      id,
      title,
      status: r.status,
      duration: r.duration,
      retries: r.retries,
      error: text(r.error || "", 12000),
    };
  });
}
export function playwrightResults(report) {
  if (!report || !Array.isArray(report.suites))
    throw Error("Choose a Playwright JSON reporter file or JUnit XML.");
  const rows = [];
  function walk(suites, parents = [], depth = 0) {
    if (depth > 30 || !Array.isArray(suites))
      throw Error("Invalid suite structure.");
    for (const suite of suites) {
      const path = [...parents, text(suite.title || "", 2000)];
      for (const spec of suite.specs || []) {
        for (const t of spec.tests || []) {
          if (!Array.isArray(t.results) || !t.results.length)
            throw Error("A test has no attempt results.");
          const attempts = t.results;
          if (
            attempts.some(
              (a) =>
                ![
                  "passed",
                  "failed",
                  "timedOut",
                  "skipped",
                  "interrupted",
                ].includes(a.status) ||
                !Number.isFinite(a.duration) ||
                a.duration < 0,
            )
          )
            throw Error("Invalid Playwright attempt.");
          const expected = t.expectedStatus || "passed";
          if (!["passed", "failed", "skipped"].includes(expected))
            throw Error("Unsupported expected status.");
          const last = attempts.at(-1);
          const ok = (a) => a.status === expected;
          const status =
            last.status === "skipped"
              ? "skipped"
              : !ok(last)
                ? "failed"
                : attempts.some((a) => !ok(a))
                  ? "flaky"
                  : "passed";
          const title = [...path, text(spec.title, 2000)]
            .filter(Boolean)
            .join(" › ");
          rows.push({
            id: `${t.projectName || "default"}|${suite.file || spec.file || ""}|${title}`,
            title,
            status,
            duration: attempts.reduce((n, a) => n + a.duration, 0),
            retries: attempts.length - 1,
            error: attempts
              .flatMap((a) => a.errors || (a.error ? [a.error] : []))
              .map((e) => e.message || "")
              .join("\n")
              .slice(0, 12000),
          });
          if (rows.length > 2000) throw Error("Report exceeds 2000 tests.");
        }
      }
      walk(suite.suites || [], path, depth + 1);
    }
  }
  walk(report.suites);
  if (report.errors?.length)
    throw Error(
      "Report contains run-level errors. Resolve these before comparing test results.",
    );
  return normalizeResults(rows);
}
export function compareResults(current, previous = []) {
  const old = new Map(previous.map((r) => [r.id, r]));
  return current.map((r) => ({
    ...r,
    change: !old.has(r.id)
      ? "New identity"
      : old.get(r.id).status === r.status
        ? "Unchanged"
        : `${old.get(r.id).status} → ${r.status}`,
  }));
}
export const CHECKLISTS = {
  accessibility: [
    [
      "Keyboard journey",
      "Use Tab and Shift+Tab through a complete flow. Activate controls with the keyboard and check for traps.",
    ],
    [
      "Visible focus",
      "Check that focus remains visible and moves sensibly after dialogs, validation and navigation.",
    ],
    [
      "Labels and errors",
      "Check control names, instructions, required state and error associations with assistive technology.",
    ],
    [
      "Zoom and reflow",
      "At 200% zoom and a narrow viewport, check readability and that controls or information are not lost.",
    ],
    [
      "Screen reader journey",
      "With a screen reader, inspect headings, landmarks, status announcements and the complete task.",
    ],
  ],
  security: [
    [
      "Permission boundaries",
      "In an authorized test environment, verify each agreed role can access only its own allowed actions and records.",
    ],
    [
      "Session lifecycle",
      "Check the agreed sign-out, expiry and session invalidation behavior; inspect previously open pages.",
    ],
    [
      "Input and output",
      "Use agreed harmless invalid inputs; verify server rejection and safe display without exposing sensitive details.",
    ],
    [
      "Retry and state changes",
      "Check repeated submissions and interrupted flows against agreed duplicate-processing and recovery rules.",
    ],
    [
      "Sensitive data",
      "Review permitted test logs, exports and error messages for unintended exposure of synthetic secrets or identifiers.",
    ],
  ],
};

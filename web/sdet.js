import {
  PROFILES,
  campaign,
  decisionRows,
  decisionProject,
  parseJSON,
  contractSuite,
  checkContract,
  contractJUnit,
  HEALTH_CONTRACT,
} from "/sdet-model.js";
import { csv } from "/daily-model.js";
const root = document.querySelector('[data-panel="launch"]');
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function field(
  parent,
  label,
  id,
  { area = false, value = "", max = 5000, required = true } = {},
) {
  const l = el("label", label),
    n = el(area ? "textarea" : "input");
  l.htmlFor = id;
  n.id = id;
  n.value = value;
  n.maxLength = max;
  n.required = required;
  parent.append(l, n);
  return n;
}
function select(parent, label, id, options) {
  const l = el("label", label),
    n = el("select");
  l.htmlFor = id;
  n.id = id;
  for (const [value, name] of options) {
    const o = el("option", name);
    o.value = value;
    n.append(o);
  }
  parent.append(l, n);
  return n;
}
function button(parent, label, fn, submit = false) {
  const b = el("button", label, "button subtle");
  b.type = submit ? "submit" : "button";
  if (fn) b.addEventListener("click", fn);
  parent.append(b);
  return b;
}
function status(parent) {
  const n = el("p", "", "daily-status");
  n.setAttribute("role", "status");
  parent.append(n);
  return n;
}
function card(id, title, description) {
  const d = el("details", undefined, "panel daily-tool");
  d.id = id;
  d.append(el("summary", title), el("p", description, "muted"));
  root.append(d);
  return d;
}
function download(text, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openTool(view, id) {
  location.hash = view;
  setTimeout(() => {
    const n = document.getElementById(id);
    if (n) {
      if (n.tagName === "DETAILS") n.open = true;
      n.scrollIntoView({ block: "start" });
      n.querySelector("summary")?.focus();
    }
  }, 0);
}

const path = root.querySelector(".launch-path");
for (const [number, title, description, view, id] of [
  [
    "01",
    "Understand",
    "Clarify rules and unanswered questions.",
    "daily",
    "daily-story",
  ],
  [
    "02",
    "Design",
    "Build a reviewable campaign or decision table.",
    "launch",
    "launch-campaign",
  ],
  [
    "03",
    "Check APIs",
    "Assert recorded responses or capture local health.",
    "launch",
    "launch-contract",
  ],
  [
    "04",
    "Execute",
    "Review current cases, record actual observations and evidence.",
    "workspace",
    "workspace-create",
  ],
  [
    "05",
    "Investigate",
    "Timebox exploration, compare UI and draft defects.",
    "daily",
    "daily-explore",
  ],
  [
    "06",
    "Review release",
    "Retest defects and assess current evidence gaps in QA workspace.",
    "workspace",
    "workspace-select",
  ],
]) {
  const c = el("article", undefined, "launch-step");
  c.append(
    el("span", number, "tag"),
    el("h3", title),
    el("p", description, "muted"),
  );
  const action = {
    Understand: "Clarify story",
    Design: "Plan test coverage",
    "Check APIs": "Inspect API contracts",
    Execute: "Open execution workspace",
    Investigate: "Start exploration",
    "Review release": "Review release evidence",
  }[title];
  button(c, action, () => openTool(view, id));
  path.append(c);
}

const plan = card(
  "launch-campaign",
  "Build a guided test campaign",
  "Choose a feature profile and enter confirmed acceptance criteria. Positive, negative, boundary and recovery prompts remain unreviewed until you supply exact steps, data and expected behavior. These are deterministic prompts, not story analysis.",
);
plan.open = true;
const form = el("form");
form.id = "launch-plan-form";
plan.append(form);
const name = field(form, "Campaign feature name", "launch-feature", {
  max: 80,
});
const profile = select(
  form,
  "Feature profile",
  "launch-profile",
  Object.entries(PROFILES).map(([key, p]) => [key, p.label]),
);
const criteria = field(
  form,
  "Confirmed criteria · one per line, maximum 8",
  "launch-criteria",
  { area: true, max: 5000 },
);
button(form, "Build campaign", null, true);
const ps = status(plan),
  questions = el("ul"),
  counts = el("p");
plan.append(counts, questions);
let pack;
const create = button(plan, "Add campaign to QA workspace", () => {
  if (pack) addWorkspace(pack.backup, ps);
});
create.disabled = true;
const exportPlan = button(plan, "Download campaign backup", () =>
  download(pack.backup, "qa-campaign.json"),
);
exportPlan.disabled = true;
form.addEventListener("input", () => {
  pack = null;
  create.disabled = exportPlan.disabled = true;
  ps.textContent = "Inputs changed. Build a new campaign.";
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    pack = campaign({
      name: name.value,
      criteria: criteria.value,
      profile: profile.value,
    });
    counts.textContent = `${pack.project.requirements.length} criteria · ${pack.project.cases.length} design prompts · 0 reviewed · 0 executed`;
    questions.replaceChildren(...pack.questions.map((q) => el("li", q)));
    create.disabled = exportPlan.disabled = false;
    ps.textContent =
      "Campaign prepared. Clarify these profile questions before reviewing the generated designs. Risk scores start at neutral 3×3; assess each criterion in QA workspace.";
  } catch (error) {
    ps.textContent = error.message;
  }
});

const requests = new Map();
function addWorkspace(raw, feedback) {
  const requestId = crypto.randomUUID();
  requests.set(requestId, feedback);
  window.dispatchEvent(
    new CustomEvent("qp:workspace-add", { detail: { requestId, backup: raw } }),
  );
}
window.addEventListener("qp:workspace-added", (event) => {
  const feedback = requests.get(event.detail?.requestId);
  if (!feedback) return;
  requests.delete(event.detail.requestId);
  feedback.textContent = event.detail.message;
  if (event.detail.added) location.hash = "workspace";
});

const decision = card(
  "launch-decisions",
  "Decision Table Studio",
  "Map combinations of up to five True/False conditions. Supply an expected outcome for every included rule; impossible combinations need an explicit exclusion reason. Expected behavior is never inferred.",
);
const df = el("form");
df.id = "launch-decision-form";
decision.append(df);
const dn = field(df, "Decision feature name", "decision-name", { max: 80 }),
  dc = field(df, "Decision acceptance criterion", "decision-criterion", {
    max: 500,
  }),
  conditions = field(
    df,
    "Binary conditions · one per line, maximum 5",
    "decision-conditions",
    { area: true, max: 1000 },
  );
button(df, "Generate combinations", null, true);
const ds = status(decision),
  matrix = el("div", undefined, "decision-matrix");
decision.append(matrix);
let rows = [],
  editors = [];
function readRows() {
  return rows.map((r, i) => ({
    ...r,
    expected: editors[i].expected.value,
    disposition: editors[i].disposition.value,
    reason: editors[i].reason.value,
  }));
}
df.addEventListener("input", () => {
  rows = [];
  editors = [];
  matrix.replaceChildren();
  ds.textContent =
    "Conditions or context changed. Regenerate the combinations.";
});
df.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    rows = decisionRows(conditions.value);
    editors = [];
    matrix.replaceChildren();
    for (const row of rows) {
      const box = el("article", undefined, "daily-check");
      box.id = `decision-${row.id}`;
      box.append(
        el("h3", row.id),
        el(
          "p",
          row.conditions
            .map((c) => `${c.name}: ${c.value ? "True" : "False"}`)
            .join(" · "),
        ),
      );
      const disposition = select(box, "Disposition", `${box.id}-disposition`, [
        ["test", "Include as test"],
        ["exclude", "Exclude with reason"],
      ]);
      const expected = field(
          box,
          "Confirmed expected behavior",
          `${box.id}-expected`,
          { area: true, max: 2000, required: false },
        ),
        reason = field(
          box,
          "Exclusion reason if excluded",
          `${box.id}-reason`,
          { max: 500, required: false },
        );
      editors.push({ disposition, expected, reason });
      matrix.append(box);
    }
    ds.textContent = `${rows.length} combinations generated; no outcomes assumed. Review applicability and supply expectations.`;
  } catch (error) {
    ds.textContent = error.message;
  }
});
button(decision, "Download decision table CSV", () => {
  if (!rows.length) {
    ds.textContent = "Generate combinations first.";
    return;
  }
  download(
    csv([
      [
        "Rule",
        "Conditions",
        "Disposition",
        "Expected behavior",
        "Exclusion reason",
      ],
      ...readRows().map((r) => [
        r.id,
        r.conditions.map((c) => `${c.name}=${c.value}`).join("; "),
        r.disposition,
        r.expected || "[NEEDS CONFIRMATION]",
        r.reason,
      ]),
    ]),
    "decision-table.csv",
    "text/csv",
  );
  ds.textContent =
    "Table downloaded with unresolved outcomes and exclusions explicit. Only fully specified included rows can be added to workspace.";
});
button(decision, "Add decision tests to QA workspace", () => {
  try {
    addWorkspace(decisionProject(dn.value, dc.value, readRows()), ds);
  } catch (error) {
    ds.textContent = error.message;
  }
});

const studio = card(
  "launch-contract",
  "API Contract Studio",
  "Check JSON response records against reusable assertions. Capture only this app's local health endpoint, or paste/import a permitted response record. Offline checks are not requests to a company API. No AI or external URL access is used.",
);
const cf = el("form");
cf.id = "contract-form";
studio.append(cf);
const suite = field(cf, "Contract suite JSON", "contract-suite", {
  area: true,
  max: 1024 * 1024,
  value: JSON.stringify(HEALTH_CONTRACT, null, 2),
});
const response = field(cf, "Response record JSON", "contract-response", {
  area: true,
  max: 1024 * 1024,
  value: "",
});
button(cf, "Check contract", null, true);
const cs = status(studio),
  result = el("div");
result.id = "contract-results";
studio.append(result);
let report = null,
  provenance = "User-supplied response record";
let captureVersion = 0;
function invalidate() {
  report = null;
  reportExport.disabled = junitExport.disabled = bug.disabled = true;
  result.replaceChildren();
  cs.textContent = "Inputs changed. Run assertions again.";
}
cf.addEventListener("input", () => {
  captureVersion++;
  provenance = "User-supplied response record";
  invalidate();
});
button(studio, "Capture local health response", async () => {
  const version = ++captureVersion;
  invalidate();
  cs.textContent = "Capturing this app's /api/health response…";
  try {
    const started = performance.now();
    const r = await fetch("/api/health", {
      signal: AbortSignal.timeout(10000),
    });
    const body = await r.json();
    if (version !== captureVersion) return;
    response.value = JSON.stringify(
      {
        status: r.status,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        headers: { "content-type": r.headers.get("content-type") || "" },
        body,
      },
      null,
      2,
    );
    provenance = `Live local capture · ${new Date().toISOString()} · GET /api/health`;
    cs.textContent =
      "Actual local response captured. Check the contract to evaluate assertions.";
  } catch (error) {
    if (version === captureVersion) cs.textContent = error.message;
  }
});
for (const [label, input, target] of [
  ["Import contract suite", "contract-suite-file", suite],
  ["Import response record", "contract-response-file", response],
]) {
  const l = el("label", label),
    f = el("input");
  f.type = "file";
  f.accept = ".json";
  f.id = input;
  l.htmlFor = input;
  studio.append(l, f);
  f.addEventListener("change", async () => {
    const version = ++captureVersion;
    invalidate();
    target.value = "";
    provenance = "User-supplied response record";
    try {
      const file = f.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) throw Error("File exceeds 1 MB.");
      const source = await file.text();
      if (version !== captureVersion) return;
      const parsed = parseJSON(source, label);
      target.value = JSON.stringify(
        target === suite ? contractSuite(parsed) : parsed,
        null,
        2,
      );
      cs.textContent = `${label} loaded in this tab. Run assertions to validate the response and suite.`;
    } catch (error) {
      if (version === captureVersion) cs.textContent = error.message;
    }
  });
}
cf.addEventListener("submit", (event) => {
  event.preventDefault();
  invalidate();
  captureVersion++;
  try {
    report = checkContract(
      parseJSON(suite.value, "Suite"),
      parseJSON(response.value, "Response"),
    );
    cs.textContent = `${report.results.filter((r) => r.passed).length}/${report.results.length} assertions passed. ${provenance}. This checks only the supplied assertions; it does not establish overall API correctness.`;
    result.replaceChildren(
      ...report.results.map((r) => {
        const a = el("article", undefined, "daily-check");
        a.append(
          el("h3", `${r.passed ? "PASS" : "FAIL"} · ${r.name}`),
          el(
            "p",
            `${r.path || "(root)"} · ${r.op} · expected ${JSON.stringify(r.expected) ?? "n/a"}`,
          ),
          el("pre", `Actual: ${r.actual}`),
        );
        return a;
      }),
    );
    reportExport.disabled = junitExport.disabled = false;
    bug.disabled = report.passed;
  } catch (error) {
    cs.textContent = error.message;
  }
});
button(studio, "Download reusable contract suite", () => {
  try {
    download(
      JSON.stringify(contractSuite(parseJSON(suite.value)), null, 2),
      "contract-suite.json",
    );
    cs.textContent =
      "Suite downloaded. Reuse it in the browser or with tools/check-contract.js in CI.";
  } catch (error) {
    cs.textContent = error.message;
  }
});
const reportExport = button(studio, "Download assertion evidence", () =>
  download(
    JSON.stringify({ ...report, provenance }, null, 2),
    "contract-evidence.json",
  ),
);
reportExport.disabled = true;
const junitExport = button(studio, "Download contract JUnit", () =>
  download(contractJUnit(report), "contract-junit.xml", "application/xml"),
);
junitExport.disabled = true;
const bug = button(studio, "Draft bug from contract failures", () => {
  const failures = report.results.filter((r) => !r.passed);
  window.dispatchEvent(
    new CustomEvent("qp:bug-draft", {
      detail: {
        issue: `Contract assertions failed: ${report.suite}`,
        expected: failures
          .map(
            (r) =>
              `${r.name}: ${r.path} ${r.op} ${JSON.stringify(r.expected) ?? ""}`,
          )
          .join("\n")
          .slice(0, 2000),
        actual: failures
          .map((r) => `${r.name}: ${r.actual}`)
          .join("\n")
          .slice(0, 2000),
        evidence: `${provenance}. Attach contract-evidence.json and original response after reviewing sensitive fields. Confirm reproduction and environment.`,
      },
    }),
  );
  location.hash = "bugs";
});
bug.disabled = true;

const builder = el("details", undefined, "daily-check");
builder.id = "contract-rule-builder";
builder.append(el("summary", "Add an assertion without editing JSON"));
studio.insertBefore(builder, cf);
const bf = el("form");
bf.id = "contract-rule-form";
builder.append(bf);
const ruleName = field(bf, "New assertion name", "contract-rule-name", {
  max: 100,
});
const rulePath = field(
  bf,
  "Response field path · for example /body/status",
  "contract-rule-path",
  { max: 500, value: "/body/status", required: false },
);
const ruleOp = select(bf, "Assertion operator", "contract-rule-op", [
  ["equals", "Equals"],
  ["type", "Has JSON type"],
  ["exists", "Exists"],
  ["absent", "Is absent"],
  ["min", "Number at least"],
  ["max", "Number at most"],
  ["length", "Has exact length"],
  ["includes", "Includes"],
]);
const valueKind = select(bf, "Expected value format", "contract-value-kind", [
  ["text", "Text"],
  ["number", "Number"],
  ["boolean", "Boolean true or false"],
  ["json", "JSON object or array"],
]);
const expectedValue = field(
  bf,
  "Expected value · type names include string, integer, boolean, array",
  "contract-rule-value",
  { required: false, max: 12000 },
);
button(bf, "Add assertion", null, true);
bf.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const parsed = contractSuite(parseJSON(suite.value));
    const rule = {
      name: ruleName.value,
      path: rulePath.value,
      op: ruleOp.value,
    };
    if (!["exists", "absent"].includes(rule.op)) {
      const value = expectedValue.value;
      if (rule.op === "type") rule.expected = value.trim();
      else if (
        ["min", "max", "length"].includes(rule.op) ||
        valueKind.value === "number"
      ) {
        if (!value.trim() || !Number.isFinite(Number(value)))
          throw Error("Enter a finite numeric expected value.");
        rule.expected = Number(value);
      } else if (valueKind.value === "boolean") {
        if (!["true", "false"].includes(value.trim()))
          throw Error("Use true or false for a Boolean expected value.");
        rule.expected = value.trim() === "true";
      } else if (valueKind.value === "json")
        rule.expected = parseJSON(value, "Expected value");
      else rule.expected = value;
    }
    const next = contractSuite({ ...parsed, rules: [...parsed.rules, rule] });
    suite.value = JSON.stringify(next, null, 2);
    captureVersion++;
    invalidate();
    cs.textContent =
      "Assertion added. Run the contract again to produce current evidence.";
    ruleName.value = "";
  } catch (error) {
    cs.textContent = error.message;
  }
});

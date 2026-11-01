import {
  createMatrix,
  addEnvironment,
  addJourney,
  recordMatrix,
  matrixSummary,
  matrixRows,
  matrixBackup,
  restoreMatrix,
} from "/compatibility-model.js";
import { csv } from "/daily-model.js";
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
const root = el("details");
root.id = "launch-compatibility";
root.className = "panel daily-tool";
root.append(
  el("summary", "Compatibility Matrix"),
  el(
    "p",
    "Record manual observations by environment, build, browser/OS and journey. These entries do not launch browsers or establish overall compatibility. Definitions stay fixed; create a new matrix for changed requirements. Download a backup before refreshing.",
  ),
);
document.querySelector('[data-panel="launch"]').append(root);
function field(parent, label, id, max = 160, area = false) {
  const l = el("label", label),
    n = el(area ? "textarea" : "input");
  l.htmlFor = id;
  n.id = id;
  n.maxLength = max;
  n.required = true;
  parent.append(l, n);
  return n;
}
function button(parent, label, fn, submit = false) {
  const b = el("button", label);
  b.className = "button subtle";
  b.type = submit ? "submit" : "button";
  if (fn) b.addEventListener("click", fn);
  parent.append(b);
  return b;
}
function download(raw, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([raw], { type })),
    a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
let matrix = null,
  importVersion = 0;
const feedback = el("p", "");
feedback.className = "daily-status";
feedback.setAttribute("role", "status");
root.append(feedback);
function attempt(fn) {
  try {
    fn();
    render();
  } catch (error) {
    feedback.textContent = error.message;
  }
}
const start = el("form");
root.append(start);
const scope = field(start, "New compatibility scope", "matrix-scope", 80);
button(start, "Create compatibility matrix", null, true);
start.addEventListener("submit", (event) => {
  event.preventDefault();
  attempt(() => {
    if (
      matrix &&
      !confirm(
        "Replace this tab's matrix? Download a JSON backup first to keep it.",
      )
    )
      return;
    matrix = createMatrix(scope.value);
    feedback.textContent =
      "Matrix created locally. Add environments/builds and journeys with confirmed expectations.";
  });
});
const controls = el("fieldset");
controls.disabled = true;
controls.append(el("legend", "Environment and journey definitions"));
root.append(controls);
const env = el("form");
controls.append(env);
const en = field(env, "Environment name", "matrix-environment", 80),
  build = field(env, "Build identifier", "matrix-build", 80),
  browser = field(
    env,
    "Browser version and OS or device",
    "matrix-browser",
    160,
  );
button(env, "Add environment/build", null, true);
env.addEventListener("submit", (event) => {
  event.preventDefault();
  attempt(() => {
    addEnvironment(matrix, {
      name: en.value,
      build: build.value,
      browser: browser.value,
    });
    feedback.textContent =
      "Environment/build added. Results for this context start as Not run.";
  });
});
const journey = el("form");
controls.append(journey);
const jn = field(journey, "Compatibility journey name", "matrix-journey", 160),
  expected = field(
    journey,
    "Confirmed journey expected behavior",
    "matrix-expected",
    1000,
    true,
  );
button(journey, "Add compatibility journey", null, true);
journey.addEventListener("submit", (event) => {
  event.preventDefault();
  attempt(() => {
    addJourney(matrix, { name: jn.value, expected: expected.value });
    feedback.textContent =
      "Journey added. Execute it separately in each agreed environment.";
  });
});
const summary = el("p"),
  rows = el("div");
rows.className = "matrix-results";
root.append(summary, rows);
const saveJSON = button(root, "Download compatibility backup", () =>
  attempt(() => download(matrixBackup(matrix), "compatibility-matrix.json")),
);
saveJSON.disabled = true;
const saveCSV = button(root, "Download compatibility CSV", () =>
  download(
    csv([
      [
        "Scope",
        "Environment",
        "Build",
        "Browser OS",
        "Journey",
        "Expected",
        "Outcome",
        "Observed result or exclusion reason",
        "Evidence",
        "Recorded at",
      ],
      ...matrixRows(matrix),
    ]),
    "compatibility-matrix.csv",
    "text/csv",
  ),
);
saveCSV.disabled = true;
const il = el("label", "Restore compatibility JSON · maximum 256 KB"),
  file = el("input");
file.id = "matrix-file";
il.htmlFor = file.id;
file.type = "file";
file.accept = ".json";
root.append(il, file);
file.addEventListener("change", async () => {
  const version = ++importVersion;
  try {
    const f = file.files[0];
    if (!f) return;
    if (f.size > 256 * 1024) throw Error("Backup exceeds 256 KB.");
    const restored = restoreMatrix(await f.text());
    if (version !== importVersion) return;
    if (
      matrix &&
      !confirm(
        "Replace this matrix with the imported manual records? They are not independently verified.",
      )
    )
      return;
    matrix = restored;
    scope.value = matrix.name;
    render();
    feedback.textContent =
      "Backup restored. Imported manual results are user-supplied records; confirm context and evidence.";
  } catch (error) {
    if (version === importVersion)
      feedback.textContent = `Restore failed; current matrix preserved. ${error.message}`;
  } finally {
    file.value = "";
  }
});
function render() {
  controls.disabled = saveJSON.disabled = saveCSV.disabled = !matrix;
  rows.replaceChildren();
  if (!matrix) return;
  const s = matrixSummary(matrix);
  summary.textContent = `${matrix.name} · ${s.total} planned combinations · ${s.notRun} Not run · ${s.passed} Passed · ${s.failed} Failed · ${s.blocked} Blocked · ${s["not-applicable"]} Not applicable. These are manually recorded outcomes.`;
  for (const e of matrix.environments)
    for (const j of matrix.journeys) {
      const card = el("article");
      card.className = "daily-check";
      card.id = `matrix-${e.id}-${j.id}`;
      card.append(
        el("h3", `${e.id} / ${j.id} · ${j.name}`),
        el("p", `${e.name} · ${e.build} · ${e.browser}`),
        el("p", `Expected: ${j.expected}`),
      );
      const record = matrix.records.find(
        (r) => r.environmentId === e.id && r.journeyId === j.id,
      );
      const f = el("form"),
        label = el("label", "Manual outcome"),
        select = el("select");
      select.id = `${card.id}-status`;
      label.htmlFor = select.id;
      for (const [key, name] of [
        ["not-run", "Not run"],
        ["passed", "Passed"],
        ["failed", "Failed"],
        ["blocked", "Blocked"],
        ["not-applicable", "Not applicable"],
      ]) {
        const o = el("option", name);
        o.value = key;
        select.append(o);
      }
      select.value = record?.status || "not-run";
      f.append(label, select);
      const actual = field(
          f,
          "Observed result or exclusion reason",
          `${card.id}-actual`,
          2000,
          true,
        ),
        evidence = field(
          f,
          "Evidence reference for executed or blocked checks",
          `${card.id}-evidence`,
          1000,
        );
      actual.required = evidence.required = false;
      actual.value = record?.actual || "";
      evidence.value = record?.evidence || "";
      button(f, "Save matrix outcome", null, true);
      f.addEventListener("submit", (event) => {
        event.preventDefault();
        attempt(() => {
          if (
            select.value === "not-run" &&
            record &&
            !confirm("Clear this recorded outcome and return it to Not run?")
          )
            return;
          recordMatrix(matrix, e.id, j.id, {
            status: select.value,
            actual: actual.value,
            evidence: evidence.value,
          });
          feedback.textContent =
            "Manual outcome saved in this tab. Export a backup to keep it.";
        });
      });
      card.append(f);
      button(card, "Draft compatibility bug", () => {
        if (record?.status !== "failed") {
          feedback.textContent =
            "Save a Failed outcome with observation and evidence before drafting a bug.";
          return;
        }
        window.dispatchEvent(
          new CustomEvent("qp:bug-draft", {
            detail: {
              issue: `${matrix.name}: ${j.name} fails in ${e.browser}`,
              expected: j.expected,
              actual: record.actual,
              evidence: `${record.evidence}\nEnvironment: ${e.name}; build: ${e.build}; browser/OS: ${e.browser}`,
              steps: `Journey: ${j.name}\nConfirm the exact reproduction steps for this environment and build.`,
            },
          }),
        );
        location.hash = "bugs";
      });
      rows.append(card);
    }
}

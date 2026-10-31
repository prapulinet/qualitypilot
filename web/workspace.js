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
} from "/workspace-model.js";
import { restorePlan } from "/coverage-model.js";
const $ = (selector) => document.querySelector(selector);
const el = (tag, value, className) => {
  const n = document.createElement(tag);
  if (value !== undefined) n.textContent = value;
  if (className) n.className = className;
  return n;
};
let projects = [],
  selected = "",
  selectedRun = "",
  dirty = false;
const active = () => projects.find((p) => p.id === selected);
const message = (text) => {
  $("#workspace-status").textContent = text;
};
function changed() {
  dirty = true;
  $("#workspace-save-state").textContent =
    "Unsaved changes · save locally or export";
}
function operation(fn) {
  const previous = structuredClone(projects),
    previousSelected = selected,
    previousRun = selectedRun;
  try {
    message("");
    fn(active());
    backup(projects);
    changed();
    render();
    if (!$("#workspace-status").textContent)
      message("Workspace updated. Save locally or export to keep your work.");
  } catch (error) {
    projects = previous;
    selected = previousSelected;
    selectedRun = previousRun;
    render();
    message(error.message);
  }
}
function button(text, callback, className = "button subtle small") {
  const n = el("button", text, className);
  n.type = "button";
  n.addEventListener("click", callback);
  return n;
}
function field(form, title, value = "", multiline = false, max = 2000) {
  const label = el("label", title),
    input = el(multiline ? "textarea" : "input");
  input.value = value;
  input.maxLength = max;
  input.required = true;
  label.append(input);
  form.append(label);
  return input;
}
function selectField(form, title, options, value) {
  const label = el("label", title),
    input = el("select");
  for (const [key, text] of options) {
    const option = el("option", text);
    option.value = key;
    input.append(option);
  }
  if (value !== undefined) input.value = value;
  input.id = `workspace-${crypto.randomUUID()}`;
  label.htmlFor = input.id;
  const wrapper = el("div");
  wrapper.append(label, input);
  form.append(wrapper);
  return input;
}
function submit(form, title, fn) {
  const n = el("button", title, "button primary small");
  form.append(n);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    operation(() => fn());
  });
}
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const riskOptions = [1, 2, 3, 4, 5].map((n) => [String(n), String(n)]);
function render() {
  const chooser = $("#workspace-select");
  chooser.replaceChildren();
  for (const p of projects) {
    const option = el("option", p.name);
    option.value = p.id;
    chooser.append(option);
  }
  chooser.value = selected;
  $("#workspace-delete").disabled = !active();
  $("#workspace-empty").hidden = Boolean(active());
  $("#workspace-detail").hidden = !active();
  if (!active()) return;
  const p = active(),
    summary = releaseSummary(p);
  $("#workspace-name").textContent = p.name;
  $("#workspace-case-count").textContent = summary.cases;
  $("#workspace-pass-count").textContent = summary.passed;
  $("#workspace-defect-count").textContent = summary.defects;
  $("#workspace-blocker-count").textContent = summary.blockers.length;
  $("#workspace-decision").textContent = summary.decision;
  const blockers = $("#workspace-blockers");
  blockers.replaceChildren();
  for (const item of [
    ...summary.blockers,
    ...summary.warnings.map((s) => `Warning: ${s}`),
  ])
    blockers.append(el("li", item));
  renderRequirements(p);
  renderCases(p);
  renderExecution(p);
  renderDefects(p);
  const history = $("#workspace-events");
  history.replaceChildren();
  for (const event of p.events.slice(-15).reverse())
    history.append(
      el("li", `${new Date(event.at).toLocaleString()} · ${event.action}`),
    );
}
function renderRequirements(p) {
  const root = $("#workspace-requirements");
  root.replaceChildren();
  const add = el("form", undefined, "workspace-inline-form");
  const title = field(add, "New acceptance criterion", "", true, 500),
    impact = selectField(add, "New criterion impact", riskOptions, "3"),
    likelihood = selectField(add, "New criterion likelihood", riskOptions, "3");
  submit(add, "Add criterion", () =>
    addRequirement(p, title.value, +impact.value, +likelihood.value),
  );
  root.append(add);
  p.requirements.forEach((r, index) => {
    const form = el("form", undefined, "workspace-record");
    form.append(
      el(
        "h4",
        `AC-${index + 1} · revision ${r.revision} · risk ${r.impact * r.likelihood}/25`,
      ),
    );
    const title = field(
        form,
        `Acceptance criterion AC-${index + 1}`,
        r.title,
        true,
        500,
      ),
      impact = selectField(
        form,
        `Impact AC-${index + 1}`,
        riskOptions,
        r.impact,
      ),
      likelihood = selectField(
        form,
        `Likelihood AC-${index + 1}`,
        riskOptions,
        r.likelihood,
      );
    submit(form, `Update AC-${index + 1}`, () =>
      reviseRequirement(p, r.id, title.value, +impact.value, +likelihood.value),
    );
    root.append(form);
  });
}
function renderCases(p) {
  const root = $("#workspace-cases");
  root.replaceChildren();
  if (!p.requirements.length) {
    root.append(el("p", "Add an acceptance criterion first.", "muted"));
    return;
  }
  const form = el("form", undefined, "workspace-record");
  const criterion = selectField(
    form,
    "Linked acceptance criterion",
    p.requirements.map((r, i) => [r.id, `AC-${i + 1}: ${r.title}`]),
  );
  const title = field(form, "New test title", "", false, 160),
    steps = field(form, "New test steps", "", true, 3000),
    expected = field(form, "New expected result", "", true);
  submit(form, "Add test case", () =>
    addCase(p, {
      requirementId: criterion.value,
      title: title.value,
      steps: steps.value,
      expected: expected.value,
    }),
  );
  root.append(form);
  p.cases.forEach((c, index) => {
    const requirement = p.requirements.find((r) => r.id === c.requirementId),
      form = el("form", undefined, "workspace-record");
    form.append(
      el(
        "h4",
        `TC-${index + 1} · v${c.version} · ${c.reviewedRevision === requirement.revision ? "Reviewed" : "Needs review"}`,
      ),
    );
    const title = field(form, `Title TC-${index + 1}`, c.title, false, 160),
      steps = field(form, `Steps TC-${index + 1}`, c.steps, true, 3000),
      expected = field(form, `Expected TC-${index + 1}`, c.expected, true);
    submit(form, `Save design TC-${index + 1}`, () =>
      editCase(p, c.id, {
        title: title.value,
        steps: steps.value,
        expected: expected.value,
      }),
    );
    const review = button(`Review TC-${index + 1}`, () => {
      if (
        title.value.trim() !== c.title ||
        steps.value.trim() !== c.steps ||
        expected.value.trim() !== c.expected
      ) {
        message("Save the edited design before reviewing it.");
        return;
      }
      operation(() => reviewCase(p, c.id));
    });
    form.append(review);
    root.append(form);
  });
}
function renderExecution(p) {
  const root = $("#workspace-execution");
  root.replaceChildren();
  const form = el("form", undefined, "workspace-inline-form"),
    name = field(form, "Execution session name", "", false, 80);
  submit(form, "Start execution session", () => {
    selectedRun = startRun(p, name.value).id;
  });
  root.append(form);
  if (!p.runs.length) return;
  if (!p.runs.some((r) => r.id === selectedRun)) selectedRun = p.runs.at(-1).id;
  const chooser = selectField(
    root,
    "Inspect execution session",
    p.runs.map((r) => [r.id, r.name]),
    selectedRun,
  );
  chooser.addEventListener("change", () => {
    selectedRun = chooser.value;
    renderExecution(p);
  });
  const run = p.runs.find((r) => r.id === selectedRun);
  root.append(
    el(
      "p",
      "Design snapshots belong to this session. Later design changes do not rewrite their expected results. Release checks use the newest session.",
      "muted small-text",
    ),
  );
  run.cases.forEach((c, index) => {
    const form = el("form", undefined, "workspace-record");
    form.append(el("h4", `Run case ${index + 1}: ${c.title} · ${c.status}`));
    form.append(
      el("p", `Steps: ${c.steps}`, "muted small-text"),
      el("p", `Expected: ${c.expected}`, "muted small-text"),
    );
    const status = selectField(
        form,
        `Result for run case ${index + 1}`,
        [
          ["", "Choose result"],
          ["passed", "Passed"],
          ["failed", "Failed"],
          ["blocked", "Blocked"],
        ],
        c.status === "not-run" ? "" : c.status,
      ),
      actual = field(
        form,
        `Observed result for run case ${index + 1}`,
        c.actual,
        true,
      ),
      evidence = field(
        form,
        `Evidence for run case ${index + 1}`,
        c.evidence,
        false,
        1000,
      );
    submit(form, `Record run case ${index + 1}`, () =>
      recordResult(p, run.id, c.caseId, {
        status: status.value,
        actual: actual.value,
        evidence: evidence.value,
      }),
    );
    root.append(form);
    if (c.status === "failed") {
      const defectForm = el("form", undefined, "workspace-record"),
        title = field(
          defectForm,
          `Defect title for run case ${index + 1}`,
          c.title,
          false,
          160,
        ),
        severity = selectField(
          defectForm,
          `Defect severity for run case ${index + 1}`,
          [
            ["", "Choose severity"],
            ["Blocker", "Blocker"],
            ["Critical", "Critical"],
            ["Major", "Major"],
            ["Minor", "Minor"],
            ["Cosmetic", "Cosmetic"],
          ],
        );
      submit(defectForm, `Link defect for run case ${index + 1}`, () =>
        linkDefect(p, run.id, c.caseId, {
          title: title.value,
          severity: severity.value,
        }),
      );
      defectForm.append(
        button(`Draft Jira report for run case ${index + 1}`, () => {
          window.dispatchEvent(
            new CustomEvent("qp:bug-draft", {
              detail: bugDraft(p, run.id, c.caseId, title.value),
            }),
          );
          location.hash = "bugs";
        }),
      );
      root.append(defectForm);
    }
  });
}
function renderDefects(p) {
  const root = $("#workspace-defects");
  root.replaceChildren();
  if (!p.defects.length)
    root.append(
      el("p", "Link a defect from a failed execution result.", "muted"),
    );
  for (const d of p.defects) {
    const form = el("form", undefined, "workspace-record");
    form.append(el("h4", `${d.title} · ${d.severity} · ${d.status}`));
    if (d.status === "open") {
      if (p.runs.length > 1) {
        const run = selectField(
          form,
          `Retest session for ${d.title}`,
          p.runs.map((r) => [r.id, r.name]),
          p.runs.at(-1).id,
        );
        submit(form, `Close after retest: ${d.title}`, () =>
          closeDefect(p, d.id, run.value),
        );
      } else
        form.append(
          el(
            "p",
            "Create a newer passing execution session before closing this defect.",
            "muted small-text",
          ),
        );
    } else
      form.append(
        button(`Reopen defect: ${d.title}`, () =>
          operation(() => reopenDefect(p, d.id)),
        ),
      );
    root.append(form);
  }
}
$("#workspace-create").addEventListener("submit", (event) => {
  event.preventDefault();
  operation(() => {
    if (projects.length >= 5)
      throw Error(
        "Maximum 5 projects. Export a backup before starting another collection.",
      );
    const p = createWorkspace($("#workspace-new-name").value);
    projects.push(p);
    selected = p.id;
    $("#workspace-new-name").value = "";
  });
});
$("#workspace-select").addEventListener("change", (event) => {
  selected = event.target.value;
  selectedRun = "";
  render();
});
$("#workspace-save").addEventListener("click", () => {
  try {
    localStorage.setItem("qp-workspaces-v1", backup(projects));
    dirty = false;
    $("#workspace-save-state").textContent =
      "Saved in this browser · export for a separate backup";
    message(
      "Saved locally by your explicit action. Do not use company data unless permitted.",
    );
  } catch {
    message("Local save failed. Export a backup to preserve your work.");
  }
});
$("#workspace-delete").addEventListener("click", () => {
  if (!active()) return;
  if (
    !confirm(
      `Delete ${active().name} from memory? Export first. The saved browser backup changes only if you Save locally afterwards.`,
    )
  ) {
    message("Deletion cancelled.");
    return;
  }
  operation((p) => {
    projects = projects.filter((item) => item.id !== p.id);
    selected = projects[0]?.id || "";
    selectedRun = "";
  });
});
$("#workspace-export").addEventListener("click", () =>
  download(
    backup(projects),
    "qualitypilot-workspaces.json",
    "application/json",
  ),
);
$("#workspace-report").addEventListener("click", () => {
  if (active())
    download(
      releaseText(active()),
      "qualitypilot-release-review.md",
      "text/markdown",
    );
});
$("#workspace-restore").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const file = $("#workspace-backup-file").files[0];
    if (!file || file.size > 2 * 1024 * 1024)
      throw Error("Choose a JSON backup up to 2 MB.");
    const next = importWorkspaces(await file.text());
    projects = next;
    selected = projects[0]?.id || "";
    selectedRun = "";
    changed();
    render();
    message(
      "Backup restored into memory. Imported manual evidence is not independently verified. Save locally only after review.",
    );
  } catch (error) {
    message(error.message);
  }
});
$("#workspace-import-plan").addEventListener("click", () =>
  operation((p) => {
    if (!p) throw Error("Create a project first.");
    const raw = localStorage.getItem("qp-coverage-v1");
    if (!raw) throw Error("Build a Coverage planner draft first.");
    const plan = restorePlan(JSON.parse(raw)),
      next = structuredClone(p);
    for (const r of plan.requirements) {
      const requirement = addRequirement(
        next,
        r.criterion,
        r.impact,
        r.likelihood,
      );
      for (const c of r.cases)
        addCase(next, {
          requirementId: requirement.id,
          title: `${c.category}: ${r.criterion}`.slice(0, 160),
          steps: c.guidance,
          expected: `[NEEDS CONFIRMATION] Specify the ${c.category.toLowerCase()} expected behavior for: ${r.criterion}`,
        });
    }
    projects[projects.findIndex((item) => item.id === p.id)] = next;
    message(
      "Imported design prompts only. Confirm expected results and review each case before execution; no previous manual result was copied.",
    );
  }),
);
$("#workspace-boundary-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const result = boundaryData(
      Number($("#workspace-min").value),
      Number($("#workspace-max").value),
    );
    $("#workspace-boundaries").textContent = result
      .map((r) => `${r.value}: ${r.expected}`)
      .join("\n");
  } catch (error) {
    message(error.message);
  }
});
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("qp:workspace-add", (event) => {
  const requestId = event.detail?.requestId;
  try {
    const incoming = importWorkspaces(event.detail?.backup);
    if (incoming.length !== 1) throw Error("Add one campaign at a time.");
    let added = false;
    operation(() => {
      if (projects.length >= 5)
        throw Error(
          "Maximum 5 projects. Export a backup before starting another collection.",
        );
      if (projects.some((p) => p.id === incoming[0].id))
        throw Error("This campaign already exists in QA workspace.");
      projects.push(incoming[0]);
      selected = incoming[0].id;
      selectedRun = "";
      added = true;
    });
    added = added && projects.some((p) => p.id === incoming[0].id);
    const result = added
      ? "Campaign added without replacing existing projects. Review current designs, then save locally or export."
      : $("#workspace-status").textContent;
    if (added) message(result);
    window.dispatchEvent(
      new CustomEvent("qp:workspace-added", {
        detail: { requestId, added, message: result },
      }),
    );
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent("qp:workspace-added", {
        detail: { requestId, added: false, message: error.message },
      }),
    );
  }
});
try {
  const raw = localStorage.getItem("qp-workspaces-v1");
  if (raw) {
    projects = importWorkspaces(raw);
    selected = projects[0]?.id || "";
    $("#workspace-save-state").textContent =
      "Loaded browser backup · manual evidence is unverified";
  }
} catch {
  message(
    "Saved projects could not be loaded. Keep an exported backup before replacing data.",
  );
}
render();

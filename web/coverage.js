import {
  buildPlan,
  restorePlan,
  risk,
  summarize,
  validateResult,
  exportCSV,
} from "/coverage-model.js";

const $ = (selector) => document.querySelector(selector);
const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
let plan;
const feedback = (message) => {
  $("#coverage-status").textContent = message;
};
function save() {
  try {
    localStorage.setItem("qp-coverage-v1", JSON.stringify(plan));
  } catch {
    feedback("Storage unavailable. Export CSV to keep your evidence.");
  }
}
function metrics() {
  const summary = summarize(plan);
  $("#coverage-reviewed").textContent = `${summary.reviewed}/${summary.total}`;
  $("#coverage-passed").textContent = `${summary.passed}/${summary.total}`;
  $("#coverage-gaps").textContent = summary.highRiskGaps.length;
  $("#coverage-verdict").textContent = summary.complete
    ? "All planned checks have reviewed, manually recorded passing evidence. This is not an automated release approval."
    : `${summary.failed} failed checks. ${summary.highRiskGaps.length} high-risk requirements lack fully reviewed passing evidence. Resolve gaps before making a release decision.`;
}
function render() {
  const root = $("#coverage-matrix");
  root.replaceChildren();
  $("#coverage-export").disabled = false;
  for (const requirement of [...plan.requirements].sort(
    (a, b) => risk(b).score - risk(a).score,
  )) {
    const card = node("article", undefined, "panel coverage-card");
    const heading = node("div", undefined, "panel-heading");
    heading.append(
      node("h3", `${requirement.id} · ${requirement.criterion}`),
      node(
        "span",
        `${risk(requirement).label} · ${risk(requirement).score}/25`,
        "tag",
      ),
    );
    card.append(heading);
    const controls = node("div", undefined, "risk-controls");
    for (const field of ["impact", "likelihood"]) {
      const label = node(
        "label",
        `${field === "impact" ? "Impact" : "Likelihood"} · ${requirement.id}`,
      );
      const select = node("select");
      for (let i = 1; i <= 5; i++) {
        const option = node(
          "option",
          `${i} · ${i === 1 ? "Lowest" : i === 5 ? "Highest" : "Moderate"}`,
        );
        option.value = i;
        select.append(option);
      }
      select.value = requirement[field];
      label.append(select);
      controls.append(label);
      select.addEventListener("change", () => {
        requirement[field] = Number(select.value);
        save();
        metrics();
        heading.lastChild.textContent = `${risk(requirement).label} · ${risk(requirement).score}/25`;
      });
    }
    card.append(controls);
    for (const testCase of requirement.cases) {
      const section = node("section", undefined, "coverage-case");
      section.append(
        node("h4", `${testCase.id} · ${testCase.category}`),
        node("p", testCase.guidance, "muted small-text"),
      );
      const review = node("label", undefined, "review-check");
      const checkbox = node("input");
      checkbox.type = "checkbox";
      checkbox.checked = testCase.reviewed;
      review.append(
        checkbox,
        document.createTextNode(` Design reviewed · ${testCase.id}`),
      );
      section.append(review);
      checkbox.addEventListener("change", () => {
        testCase.reviewed = checkbox.checked;
        save();
        metrics();
      });
      const evidenceLabel = node("label", `Evidence · ${testCase.id}`);
      const evidence = node("textarea");
      evidence.rows = 2;
      evidence.maxLength = 1000;
      evidence.value = testCase.evidence;
      evidence.placeholder =
        "Expected vs observed behavior, environment, report or defect reference";
      evidenceLabel.append(evidence);
      const resultLabel = node("label", `Manual result · ${testCase.id}`);
      const result = node("select");
      for (const [value, title] of [
        ["not-run", "Not run"],
        ["passed", "Passed"],
        ["failed", "Failed"],
        ["blocked", "Blocked"],
      ]) {
        const option = node("option", title);
        option.value = value;
        result.append(option);
      }
      result.value = testCase.status;
      resultLabel.append(result);
      const saveResult = node("button", "Save result", "button subtle small");
      saveResult.setAttribute("aria-label", `Save result ${testCase.id}`);
      saveResult.addEventListener("click", () => {
        try {
          validateResult(result.value, evidence.value);
          testCase.status = result.value;
          testCase.evidence = evidence.value;
          save();
          metrics();
          feedback(`Saved ${testCase.id} · ${testCase.status}.`);
        } catch (error) {
          feedback(error.message);
          evidence.focus();
        }
      });
      section.append(evidenceLabel, resultLabel, saveResult);
      card.append(section);
    }
    root.append(card);
  }
  metrics();
}
$("#coverage-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const next = buildPlan($("#criteria").value);
    plan = next;
    save();
    render();
    feedback(
      `Created ${plan.requirements.length} requirements and ${summarize(plan).total} draft checks. Tailor expected behavior before reviewing.`,
    );
  } catch (error) {
    feedback(error.message);
  }
});
$("#coverage-export").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([exportCSV(plan)], { type: "text/csv;charset=utf-8" }),
  );
  const link = node("a");
  link.href = url;
  link.download = "qualitypilot-traceability.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
try {
  const saved = localStorage.getItem("qp-coverage-v1");
  if (saved) {
    plan = restorePlan(JSON.parse(saved));
    $("#criteria").value = plan.requirements.map((r) => r.criterion).join("\n");
    render();
  }
} catch {
  feedback("Saved plan could not be loaded. Build a new plan to continue.");
}

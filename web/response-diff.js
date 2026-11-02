import { compareResponses } from "/response-diff-model.js";
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
const root = el("details");
root.id = "launch-response-diff";
root.className = "panel daily-tool";
root.append(
  el("summary", "API Response Compare"),
  el(
    "p",
    "Compare old and new JSON locally. Arrays match by index. Differences need review; matching responses do not prove correctness. Inputs stay in this tab until refreshed. Redact secrets before pasting or sharing downloads.",
  ),
);
document.querySelector('[data-panel="launch"]').append(root);
const form = el("form");
root.append(form);
function field(label, id, max) {
  const l = el("label", label),
    n = el("textarea");
  l.htmlFor = id;
  n.id = id;
  n.maxLength = max;
  n.rows = 5;
  form.append(l, n);
  return n;
}
const before = field("Before JSON response", "diff-before", 262144);
const after = field("After JSON response", "diff-after", 262144);
const ignored = field(
  "Ignore exact JSON Pointer paths · optional, one per line",
  "diff-ignored",
  4096,
);
ignored.placeholder = "/timestamp\n/requestId";
const compare = el("button", "Compare JSON responses");
compare.className = "button";
compare.type = "submit";
form.append(compare);
const status = el("p");
status.setAttribute("role", "status");
root.append(status);
const download = el("button", "Download JSON comparison");
download.type = "button";
download.className = "button subtle";
download.disabled = true;
root.append(download);
const result = el("div");
root.append(result);
let report = null;
form.addEventListener("input", () => {
  report = null;
  download.disabled = true;
  result.replaceChildren();
  status.textContent = "Inputs changed. Compare again for current results.";
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  report = null;
  download.disabled = true;
  result.replaceChildren();
  try {
    report = compareResponses(before.value, after.value, ignored.value);
    status.textContent = `${report.changes.length} differences · ${report.matchedIgnoredPaths.length} ignore paths matched · ${report.unmatchedIgnoredPaths.length} ignore paths unmatched. Review against confirmed requirements.`;
    for (const change of report.changes) {
      const card = el("article");
      card.className = "panel";
      card.append(el("h3", `${change.kind}: ${change.path || "(root)"}`));
      const content = el("pre", JSON.stringify(change, null, 2));
      content.style.whiteSpace = "pre-wrap";
      content.style.overflowWrap = "anywhere";
      card.append(content);
      result.append(card);
    }
    download.disabled = false;
  } catch (error) {
    status.textContent = error.message;
  }
});
download.addEventListener("click", () => {
  if (!report) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const a = el("a");
  a.href = url;
  a.download = "response-comparison.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

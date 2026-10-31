import { buildBug, bugText } from "/bug-model.js";
const form = document.querySelector("#bug-form");
const status = document.querySelector("#bug-status");
const output = document.querySelector("#bug-output");
let imageURL;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const bug = buildBug(Object.fromEntries(new FormData(form)));
    output.value = bugText(bug);
    const root = document.querySelector("#bug-questions");
    root.replaceChildren();
    for (const question of [...bug.missing, ...bug.questions]) {
      const li = document.createElement("li");
      li.textContent = question;
      root.append(li);
    }
    document.querySelector("#bug-copy").disabled = false;
    document.querySelector("#bug-download").disabled = false;
    document.querySelector("#bug-completeness").textContent = bug.missing.length
      ? `${bug.missing.length} details need confirmation`
      : "Core details provided · review required";
    status.textContent =
      "Draft prepared locally. Check expected behavior and reproduction steps before submitting.";
  } catch (error) {
    status.textContent = error.message;
  }
});
form.addEventListener("input", () => {
  if (output.value) {
    document.querySelector("#bug-copy").disabled = true;
    document.querySelector("#bug-download").disabled = true;
    status.textContent =
      "Inputs changed. Prepare the report again to include your edits.";
  }
});
document.querySelector("#bug-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent =
      "Report copied. Paste into Jira's description and set its summary separately. Attach screenshots in Jira manually.";
  } catch {
    output.focus();
    output.select();
    status.textContent =
      "Clipboard access unavailable. Report selected: press Ctrl+C (or your device's Copy action).";
  }
});
document.querySelector("#bug-download").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([output.value], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "qualitypilot-bug-report.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector("#bug-image").addEventListener("change", (event) => {
  if (imageURL) URL.revokeObjectURL(imageURL);
  const preview = document.querySelector("#bug-image-preview");
  preview.removeAttribute("src");
  preview.hidden = true;
  const file = event.target.files[0];
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    status.textContent = "Choose a PNG, JPEG or WebP image up to 5 MB.";
    event.target.value = "";
    return;
  }
  imageURL = URL.createObjectURL(file);
  preview.src = imageURL;
  preview.hidden = false;
  status.textContent =
    "Screenshot preview stays in this browser tab. It is not analyzed, uploaded or included in copied text; attach it to Jira separately.";
});
document.querySelector("#bug-clear").addEventListener("click", () => {
  form.reset();
  output.value = "";
  document.querySelector("#bug-copy").disabled = true;
  document.querySelector("#bug-download").disabled = true;
  document.querySelector("#bug-questions").replaceChildren();
  document.querySelector("#bug-completeness").textContent =
    "Draft · not submitted";
  if (imageURL) URL.revokeObjectURL(imageURL);
  imageURL = undefined;
  const preview = document.querySelector("#bug-image-preview");
  preview.hidden = true;
  preview.removeAttribute("src");
  status.textContent = "Bug report and screenshot cleared from this tab.";
});

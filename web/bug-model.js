const limits = {
  issue: 2000,
  title: 120,
  environment: 500,
  prerequisites: 1000,
  steps: 3000,
  expected: 2000,
  actual: 2000,
  evidence: 1000,
  story: 100,
};
const frequencies = [
  "Not assessed",
  "Every attempt",
  "Intermittent",
  "Observed once",
];
const severities = [
  "Not assessed",
  "Blocker",
  "Critical",
  "Major",
  "Minor",
  "Cosmetic",
];
export function buildBug(input) {
  if (!input || typeof input !== "object")
    throw Error("Enter the issue details.");
  const data = {};
  for (const [field, max] of Object.entries(limits)) {
    if (input[field] !== undefined && typeof input[field] !== "string")
      throw Error(`Invalid ${field}.`);
    data[field] = (input[field] || "").trim();
    if (data[field].length > max)
      throw Error(`${field} exceeds ${max} characters.`);
  }
  if (data.issue.length < 10)
    throw Error("Describe the observed issue in at least 10 characters.");
  const frequency = input.frequency || "Not assessed",
    severity = input.severity || "Not assessed";
  if (!frequencies.includes(frequency) || !severities.includes(severity))
    throw Error("Choose a valid frequency and severity.");
  const summary =
    data.title ||
    data.issue.split(/\r?\n/)[0].replace(/\s+/g, " ").slice(0, 120);
  const steps = data.steps
    .split(/\r?\n/)
    .map((s) => s.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean);
  if (steps.length > 20) throw Error("Use at most 20 reproduction steps.");
  const missing = [];
  if (!data.environment)
    missing.push(
      "Which browser/device, application version and environment were used?",
    );
  if (!steps.length) missing.push("What exact actions reproduce the issue?");
  if (!data.expected)
    missing.push(
      "What should happen according to the acceptance criterion? Confirm with the product owner if unclear.",
    );
  if (!data.evidence)
    missing.push(
      "Which screenshot, trace or sanitized log supports the observation?",
    );
  if (frequency === "Not assessed")
    missing.push(
      "Does it happen every time, intermittently, or was it observed only once?",
    );
  if (severity === "Not assessed")
    missing.push(
      "Who is affected, and is there a workaround? Assess severity with your team.",
    );
  const questions = [];
  if (/login|sign.?in|password|session/i.test(data.issue))
    questions.push(
      "Check the account role, account state and session state; do not include real passwords in the report.",
    );
  if (/save|submit|checkout|payment/i.test(data.issue))
    questions.push(
      "Was the operation persisted? Check for duplicate submissions and record only observed results.",
    );
  if (/validation|length|limit|required|error message/i.test(data.issue))
    questions.push(
      "Confirm the relevant required-field or boundary rule from the acceptance criteria.",
    );
  return {
    summary,
    ...data,
    actual: data.actual || data.issue,
    steps,
    frequency,
    severity,
    missing,
    questions,
    source: "local-template",
    reviewRequired: true,
  };
}
const unknown = (label) => `[Needs confirmation: ${label}]`;
export function bugText(bug) {
  return [
    "SUMMARY",
    bug.summary,
    "",
    "RELATED STORY / ACCEPTANCE CRITERION",
    bug.story || "Not provided",
    "",
    "ENVIRONMENT",
    bug.environment || unknown("browser/device, app version and environment"),
    "",
    "PRECONDITIONS",
    bug.prerequisites || "Not provided; confirm before reproducing.",
    "",
    "STEPS TO REPRODUCE",
    bug.steps.length
      ? bug.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : unknown("exact reproduction steps"),
    "",
    "EXPECTED RESULT",
    bug.expected || unknown("expected behavior from the acceptance criterion"),
    "",
    "ACTUAL RESULT",
    bug.actual,
    "",
    "REPRODUCIBILITY",
    bug.frequency,
    "",
    "SEVERITY (TESTER ASSESSMENT)",
    bug.severity,
    "",
    "PRIORITY",
    "To be determined in team triage.",
    "",
    "EVIDENCE / ATTACHMENTS",
    bug.evidence || unknown("screenshot, trace or sanitized log reference"),
    "",
    "REVIEW STATUS",
    "Draft — review before submitting. No root cause has been established.",
    ...(bug.missing.length
      ? ["", "DETAILS TO CONFIRM", ...bug.missing.map((q) => `- ${q}`)]
      : []),
  ].join("\n");
}

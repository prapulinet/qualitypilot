export function buildPlan(text) {
  if (typeof text !== "string" || text.length > 4000)
    throw Error("Use at most 4000 characters.");
  const criteria = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (
    !criteria.length ||
    criteria.length > 12 ||
    criteria.some((line) => line.length < 10 || line.length > 250)
  )
    throw Error("Enter 1–12 criteria, each 10–250 characters, one per line.");
  if (
    new Set(criteria.map((line) => line.toLowerCase())).size !== criteria.length
  )
    throw Error("Remove duplicate acceptance criteria.");
  return {
    version: 1,
    requirements: criteria.map((criterion, index) => ({
      id: `AC-${index + 1}`,
      criterion,
      impact: 3,
      likelihood: 3,
      cases: [
        [
          "Positive",
          "Exercise the workflow with valid prerequisites and verify the acceptance criterion.",
        ],
        [
          "Negative",
          "Identify an invalid input or missing prerequisite; specify rejection behavior before executing.",
        ],
        [
          "Boundary",
          "Identify a relevant value, state or permission boundary; specify its expected behavior before executing.",
        ],
      ].map(([category, guidance], i) => ({
        id: `AC-${index + 1}-TC-${i + 1}`,
        category,
        guidance,
        reviewed: false,
        status: "not-run",
        evidence: "",
      })),
    })),
  };
}

export function risk(requirement) {
  const score = requirement.impact * requirement.likelihood;
  return { score, label: score >= 15 ? "High" : score >= 8 ? "Medium" : "Low" };
}

export function summarize(plan) {
  const requirements = plan.requirements;
  const cases = requirements.flatMap((r) => r.cases);
  const gaps = requirements.filter(
    (r) =>
      risk(r).label === "High" &&
      r.cases.some(
        (c) => !c.reviewed || c.status !== "passed" || !c.evidence.trim(),
      ),
  );
  return {
    total: cases.length,
    reviewed: cases.filter((c) => c.reviewed).length,
    passed: cases.filter((c) => c.status === "passed").length,
    failed: cases.filter((c) => c.status === "failed").length,
    highRiskGaps: gaps.map((r) => r.id),
    complete:
      cases.length > 0 &&
      cases.every(
        (c) => c.reviewed && c.status === "passed" && c.evidence.trim(),
      ),
  };
}

export function validateResult(status, evidence) {
  if (!["not-run", "passed", "failed", "blocked"].includes(status))
    throw Error("Invalid result status.");
  if (typeof evidence !== "string" || evidence.length > 1000)
    throw Error("Evidence must be at most 1000 characters.");
  if (status !== "not-run" && !evidence.trim())
    throw Error(
      "Add an evidence note or artifact reference before saving a result.",
    );
}

export function restorePlan(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.requirements))
    throw Error("Invalid saved plan.");
  const canonical = buildPlan(
    value.requirements.map((r) => r.criterion).join("\n"),
  );
  canonical.requirements.forEach((r, i) => {
    const saved = value.requirements[i];
    if (
      ![saved.impact, saved.likelihood].every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 5,
      ) ||
      !Array.isArray(saved.cases) ||
      saved.cases.length !== 3
    )
      throw Error("Invalid saved plan.");
    r.impact = saved.impact;
    r.likelihood = saved.likelihood;
    r.cases.forEach((c, j) => {
      const item = saved.cases[j];
      validateResult(item.status, item.evidence);
      if (typeof item.reviewed !== "boolean")
        throw Error("Invalid saved review.");
      Object.assign(c, {
        status: item.status,
        evidence: item.evidence,
        reviewed: item.reviewed,
      });
    });
  });
  return canonical;
}

function csvCell(value) {
  let text = String(value);
  // Prevent spreadsheet formula execution when exported text is opened in Excel.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportCSV(plan) {
  const rows = [
    [
      "Requirement",
      "Acceptance criterion",
      "Risk",
      "Score",
      "Test case",
      "Category",
      "Reviewed",
      "Manual result",
      "Evidence",
    ],
  ];
  for (const r of plan.requirements)
    for (const c of r.cases)
      rows.push([
        r.id,
        r.criterion,
        risk(r).label,
        risk(r).score,
        c.id,
        c.category,
        c.reviewed,
        c.status,
        c.evidence,
      ]);
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

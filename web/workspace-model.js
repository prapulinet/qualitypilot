const copy = (value) => structuredClone(value);
const stamp = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const statuses = ["not-run", "passed", "failed", "blocked"];
const severities = ["Blocker", "Critical", "Major", "Minor", "Cosmetic"];
function text(value, label, max = 2000) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
function number(value, label, min = 1, max = 5) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw Error(`Invalid ${label}.`);
  return value;
}
function find(list, key, label) {
  const item = list.find((item) => item.id === key);
  if (!item) throw Error(`${label} not found.`);
  return item;
}
function event(project, action, target) {
  project.events.push({ id: id(), at: stamp(), action, target });
  project.events = project.events.slice(-200);
}
export function createWorkspace(name) {
  return {
    id: id(),
    name: text(name, "Project name", 80),
    requirements: [],
    cases: [],
    runs: [],
    defects: [],
    events: [],
  };
}
export function addRequirement(project, title, impact = 3, likelihood = 3) {
  if (project.requirements.length >= 30)
    throw Error("Maximum 30 requirements per project.");
  const requirement = {
    id: id(),
    title: text(title, "Acceptance criterion", 500),
    impact: number(impact, "impact"),
    likelihood: number(likelihood, "likelihood"),
    revision: 1,
  };
  project.requirements.push(requirement);
  event(project, "requirement-created", requirement.id);
  return requirement;
}
export function reviseRequirement(project, key, title, impact, likelihood) {
  const requirement = find(project.requirements, key, "Requirement");
  const update = {
    title: text(title, "Acceptance criterion", 500),
    impact: number(impact, "impact"),
    likelihood: number(likelihood, "likelihood"),
  };
  if (
    Object.entries(update).some(
      ([field, value]) => requirement[field] !== value,
    )
  ) {
    Object.assign(requirement, update);
    requirement.revision++;
    event(project, "requirement-revised", requirement.id);
  }
  return requirement;
}
export function addCase(project, input) {
  if (project.cases.length >= 100)
    throw Error("Maximum 100 cases per project.");
  find(project.requirements, input.requirementId, "Requirement");
  const item = {
    id: id(),
    requirementId: input.requirementId,
    title: text(input.title, "Test title", 160),
    steps: text(input.steps, "Steps", 3000),
    expected: text(input.expected, "Expected result"),
    version: 1,
    reviewedRevision: 0,
  };
  project.cases.push(item);
  event(project, "case-created", item.id);
  return item;
}
export function editCase(project, key, input) {
  const item = find(project.cases, key, "Test case");
  const changes = {
    title: text(input.title, "Test title", 160),
    steps: text(input.steps, "Steps", 3000),
    expected: text(input.expected, "Expected result"),
  };
  if (Object.entries(changes).some(([field, value]) => item[field] !== value)) {
    Object.assign(item, changes);
    item.version++;
    item.reviewedRevision = 0;
    event(project, "case-edited", item.id);
  }
  return item;
}
export function reviewCase(project, key) {
  const item = find(project.cases, key, "Test case");
  if (item.expected.includes("[NEEDS CONFIRMATION]"))
    throw Error(
      "Replace the expected-result clarification placeholder before reviewing this case.",
    );
  item.reviewedRevision = find(
    project.requirements,
    item.requirementId,
    "Requirement",
  ).revision;
  event(project, "case-reviewed", item.id);
}
export function startRun(project, name) {
  if (!project.cases.length)
    throw Error("Add and review test cases before starting a session.");
  if (project.runs.length >= 20)
    throw Error(
      "Maximum 20 sessions per project. Export a backup and start a new project.",
    );
  if (
    project.cases.some(
      (c) =>
        c.reviewedRevision !==
        find(project.requirements, c.requirementId, "Requirement").revision,
    )
  )
    throw Error("Review all current test designs before starting a session.");
  const run = {
    id: id(),
    name: text(name, "Session name", 80),
    createdAt: stamp(),
    cases: project.cases.map((c) => ({
      caseId: c.id,
      requirementId: c.requirementId,
      requirementRevision: find(
        project.requirements,
        c.requirementId,
        "Requirement",
      ).revision,
      caseVersion: c.version,
      title: c.title,
      steps: c.steps,
      expected: c.expected,
      status: "not-run",
      actual: "",
      evidence: "",
    })),
  };
  project.runs.push(run);
  event(project, "session-created", run.id);
  return run;
}
export function recordResult(project, runId, caseId, result) {
  const run = find(project.runs, runId, "Session"),
    item = run.cases.find((c) => c.caseId === caseId);
  if (!item) throw Error("Session case not found.");
  if (
    project.defects.some(
      (d) =>
        d.status === "closed" && d.resolution === runId && d.caseId === caseId,
    )
  )
    throw Error(
      "This retest supports a closed defect. Reopen the defect before correcting its result, or start a new session.",
    );
  if (!["passed", "failed", "blocked"].includes(result.status))
    throw Error("Choose Passed, Failed or Blocked.");
  const actual = text(result.actual, "Observed result"),
    evidence = text(result.evidence, "Evidence reference", 1000);
  const previous = item.status;
  Object.assign(item, { status: result.status, actual, evidence });
  event(
    project,
    `result-${previous}-to-${result.status}`,
    `${runId}/${caseId}`,
  );
}
export function linkDefect(project, runId, caseId, input) {
  if (project.defects.length >= 100)
    throw Error("Maximum 100 defects per project.");
  const run = find(project.runs, runId, "Session"),
    item = run.cases.find((c) => c.caseId === caseId);
  if (!item || item.status !== "failed")
    throw Error("Record a failed result before creating its linked defect.");
  if (!severities.includes(input.severity))
    throw Error("Choose a severity assessment.");
  const defect = {
    id: id(),
    runId,
    caseId,
    title: text(input.title, "Defect title", 160),
    severity: input.severity,
    status: "open",
    evidence: item.evidence,
    resolution: "",
  };
  project.defects.push(defect);
  event(project, "defect-linked", defect.id);
  return defect;
}
export function bugDraft(project, runId, caseId, title = "") {
  const run = find(project.runs, runId, "Session"),
    item = run.cases.find((c) => c.caseId === caseId);
  if (!item || item.status !== "failed")
    throw Error("A failed execution result is required for this bug draft.");
  return {
    issue: `Failed test case: ${item.title}. Observed: ${item.actual}`.slice(
      0,
      2000,
    ),
    title: (title.trim() || item.title).slice(0, 120),
    steps: item.steps,
    expected: item.expected,
    actual: item.actual,
    evidence: item.evidence,
    story: `Local requirement ${item.requirementId}`,
  };
}
export function closeDefect(project, defectId, retestRunId) {
  const defect = find(project.defects, defectId, "Defect"),
    run = find(project.runs, retestRunId, "Retest session");
  if (defect.status === "closed")
    throw Error("Reopen the defect before changing its closure.");
  if (
    project.runs.indexOf(run) <=
    project.runs.findIndex((r) => r.id === defect.runId)
  )
    throw Error("Retest in a newer session before closing the defect.");
  const item = run.cases.find((c) => c.caseId === defect.caseId),
    current = find(project.cases, defect.caseId, "Test case"),
    requirement = find(
      project.requirements,
      current.requirementId,
      "Requirement",
    );
  if (
    !item ||
    item.status !== "passed" ||
    !item.evidence ||
    item.caseVersion !== current.version ||
    item.requirementRevision !== requirement.revision ||
    current.reviewedRevision !== requirement.revision
  )
    throw Error(
      "Closure needs a passing retest against the current reviewed design with evidence.",
    );
  defect.status = "closed";
  defect.resolution = run.id;
  event(project, "defect-closed-after-retest", defect.id);
}
export function reopenDefect(project, defectId) {
  const defect = find(project.defects, defectId, "Defect");
  defect.status = "open";
  defect.resolution = "";
  event(project, "defect-reopened", defect.id);
}
export function releaseSummary(project) {
  const latest = project.runs.at(-1),
    blockers = [],
    warnings = [];
  if (!project.requirements.length)
    blockers.push("No acceptance criteria defined.");
  for (const requirement of project.requirements) {
    const cases = project.cases.filter(
        (c) => c.requirementId === requirement.id,
      ),
      score = requirement.impact * requirement.likelihood;
    if (!cases.length) blockers.push(`No test design: ${requirement.title}`);
    for (const c of cases) {
      const result = latest?.cases.find((r) => r.caseId === c.id);
      if (c.reviewedRevision !== requirement.revision)
        blockers.push(`Design review required: ${c.title}`);
      if (
        !result ||
        result.caseVersion !== c.version ||
        result.requirementRevision !== requirement.revision ||
        result.status !== "passed" ||
        !result.evidence
      )
        blockers.push(
          `${score >= 15 ? "High-risk gap" : "Evidence gap"}: ${c.title}`,
        );
    }
  }
  for (const defect of project.defects.filter((d) => d.status === "open"))
    (["Blocker", "Critical", "Major"].includes(defect.severity)
      ? blockers
      : warnings
    ).push(`Open ${defect.severity.toLowerCase()} defect: ${defect.title}`);
  return {
    source: "manually-recorded-evidence",
    decision: blockers.length
      ? "Not ready for release review"
      : "Ready for human release review",
    blockers,
    warnings,
    latestRun: latest?.name || "None",
    requirements: project.requirements.length,
    cases: project.cases.length,
    passed: latest?.cases.filter((c) => c.status === "passed").length || 0,
    defects: project.defects.filter((d) => d.status === "open").length,
  };
}
export function boundaryData(min, max) {
  number(min, "minimum", -1000000, 1000000);
  number(max, "maximum", -1000000, 1000000);
  if (min > max) throw Error("Minimum must not exceed maximum.");
  return [...new Set([min - 1, min, min + 1, max - 1, max, max + 1])].map(
    (value) => ({
      value,
      expected:
        value >= min && value <= max
          ? "Within inclusive range"
          : "Outside inclusive range",
    }),
  );
}
export function releaseText(project) {
  const summary = releaseSummary(project);
  return [
    `# Release review: ${project.name}`,
    `Decision: ${summary.decision}`,
    `Source: manual observations; not independently verified.`,
    `Latest session: ${summary.latestRun}`,
    `Criteria: ${summary.requirements} | Cases: ${summary.cases} | Latest passes: ${summary.passed} | Open defects: ${summary.defects}`,
    "",
    "## Blockers",
    ...(summary.blockers.length
      ? summary.blockers.map((s) => `- ${s}`)
      : ["None identified within this plan."]),
    "",
    "## Warnings",
    ...summary.warnings.map((s) => `- ${s}`),
    "",
    "## Traceability",
    ...project.requirements.map(
      (r) =>
        `${r.title} [revision ${r.revision}, risk ${r.impact * r.likelihood}/25] → ${
          project.cases
            .filter((c) => c.requirementId === r.id)
            .map((c) => c.title)
            .join("; ") || "NO CASES"
        }`,
    ),
    "",
    "## Decision limits",
    "Human sign-off is required. This report does not prove bug-free behavior or actual artifact authenticity.",
  ].join("\n");
}
// Untrusted backup input is reconstructed into an allowlisted schema.
export function importWorkspaces(raw) {
  if (
    typeof raw !== "string" ||
    raw.length > 2 * 1024 * 1024 ||
    new TextEncoder().encode(raw).length > 2 * 1024 * 1024
  )
    throw Error("Backup must be JSON up to 2 MB.");
  const value = JSON.parse(raw);
  if (
    value?.version !== 1 ||
    !Array.isArray(value.projects) ||
    value.projects.length > 5
  )
    throw Error("Unsupported workspace backup.");
  const array = (list, max) => {
    if (!Array.isArray(list) || list.length > max)
      throw Error("Invalid backup collection.");
    return list;
  };
  const key = (value) => {
    if (typeof value !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(value))
      throw Error("Invalid backup identifier.");
    return value;
  };
  const unique = (list) => {
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw Error("Duplicate backup identifiers.");
    return list;
  };
  return unique(
    value.projects.map((p) => {
      const project = {
        id: key(p.id),
        name: text(p.name, "Project", 80),
        requirements: [],
        cases: [],
        runs: [],
        defects: [],
        events: [],
      };
      project.requirements = unique(
        array(p.requirements, 30).map((r) => ({
          id: key(r.id),
          title: text(r.title, "Criterion", 500),
          impact: number(r.impact, "impact"),
          likelihood: number(r.likelihood, "likelihood"),
          revision: number(r.revision, "revision", 1, 100000),
        })),
      );
      project.cases = unique(
        array(p.cases, 100).map((c) => {
          find(project.requirements, c.requirementId, "Linked requirement");
          return {
            id: key(c.id),
            requirementId: c.requirementId,
            title: text(c.title, "Case title", 160),
            steps: text(c.steps, "Steps", 3000),
            expected: text(c.expected, "Expected"),
            version: number(c.version, "case version", 1, 100000),
            reviewedRevision: number(
              c.reviewedRevision,
              "review revision",
              0,
              100000,
            ),
          };
        }),
      );
      project.runs = unique(
        array(p.runs, 20).map((r) => {
          const seen = new Set();
          return {
            id: key(r.id),
            name: text(r.name, "Session name", 80),
            createdAt: text(r.createdAt, "Timestamp", 40),
            cases: array(r.cases, 100).map((c) => {
              const linked = find(project.cases, c.caseId, "Linked test case");
              if (
                seen.has(c.caseId) ||
                c.requirementId !== linked.requirementId ||
                !statuses.includes(c.status)
              )
                throw Error("Invalid backup execution link.");
              seen.add(c.caseId);
              const result = {
                caseId: linked.id,
                requirementId: linked.requirementId,
                requirementRevision: number(
                  c.requirementRevision,
                  "snapshot revision",
                  1,
                  100000,
                ),
                caseVersion: number(
                  c.caseVersion,
                  "snapshot version",
                  1,
                  100000,
                ),
                title: text(c.title, "Snapshot title", 160),
                steps: text(c.steps, "Snapshot steps", 3000),
                expected: text(c.expected, "Snapshot expected"),
                status: c.status,
                actual: c.status === "not-run" ? "" : text(c.actual, "Actual"),
                evidence:
                  c.status === "not-run"
                    ? ""
                    : text(c.evidence, "Evidence", 1000),
              };
              return result;
            }),
          };
        }),
      );
      project.defects = unique(
        array(p.defects, 100).map((d) => {
          const run = find(project.runs, d.runId, "Defect session");
          if (
            !run.cases.some((c) => c.caseId === d.caseId) ||
            !severities.includes(d.severity) ||
            !["open", "closed"].includes(d.status)
          )
            throw Error("Invalid defect link.");
          if (d.status === "closed") {
            const retest = find(project.runs, d.resolution, "Retest session");
            if (
              project.runs.indexOf(retest) <= project.runs.indexOf(run) ||
              !retest.cases.some(
                (c) =>
                  c.caseId === d.caseId && c.status === "passed" && c.evidence,
              )
            )
              throw Error("Invalid closed-defect retest link.");
          }
          return {
            id: key(d.id),
            runId: d.runId,
            caseId: d.caseId,
            title: text(d.title, "Defect title", 160),
            severity: d.severity,
            status: d.status,
            evidence: text(d.evidence, "Defect evidence", 1000),
            resolution: d.status === "closed" ? d.resolution : "",
          };
        }),
      );
      project.events = array(p.events, 200).map((e) => ({
        id: key(e.id),
        at: text(e.at, "Event timestamp", 40),
        action: text(e.action, "Action", 100),
        target: text(e.target, "Target", 150),
      }));
      return project;
    }),
  );
}
export function backup(projects) {
  const json = JSON.stringify(
    { version: 1, projects: copy(projects) },
    null,
    2,
  );
  if (new TextEncoder().encode(json).length > 2 * 1024 * 1024)
    throw Error(
      "Workspace collection exceeds the 2 MB backup budget. Shorten evidence notes or use a smaller collection.",
    );
  return json;
}

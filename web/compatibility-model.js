const limit = 256 * 1024;
const allowed = ["passed", "failed", "blocked", "not-applicable"];
function text(value, label, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
function normalize(value) {
  if (
    !value ||
    value.version !== 1 ||
    ![value.environments, value.journeys, value.records].every(Array.isArray) ||
    value.environments.length > 8 ||
    value.journeys.length > 8 ||
    value.records.length > 64
  )
    throw Error(
      "Use a version 1 compatibility matrix with up to 8 environments and 8 journeys.",
    );
  const name = text(value.name, "Matrix scope", 80),
    environmentKeys = new Set(),
    journeyKeys = new Set();
  const environments = value.environments.map((e, i) => {
    if (e.id !== `E-${i + 1}`) throw Error("Invalid environment identity.");
    const item = {
      id: e.id,
      name: text(e.name, "Environment name", 80),
      build: text(e.build, "Build", 80),
      browser: text(e.browser, "Browser and OS", 160),
    };
    const key = JSON.stringify([
      item.name,
      item.build,
      item.browser,
    ]).toLowerCase();
    if (environmentKeys.has(key))
      throw Error("Duplicate environment/build/browser combination.");
    environmentKeys.add(key);
    return item;
  });
  const journeys = value.journeys.map((j, i) => {
    if (j.id !== `J-${i + 1}`) throw Error("Invalid journey identity.");
    const item = {
      id: j.id,
      name: text(j.name, "Journey name", 160),
      expected: text(j.expected, "Expected behavior", 1000),
    };
    if (item.expected.includes("[NEEDS CONFIRMATION]"))
      throw Error("Confirm the journey's expected behavior first.");
    const key = item.name.toLowerCase();
    if (journeyKeys.has(key)) throw Error("Journey names must be distinct.");
    journeyKeys.add(key);
    return item;
  });
  const pairs = new Set();
  const records = value.records.map((r) => {
    if (
      !environments.some((e) => e.id === r.environmentId) ||
      !journeys.some((j) => j.id === r.journeyId) ||
      !allowed.includes(r.status)
    )
      throw Error("Invalid result status or matrix link.");
    const key = `${r.environmentId}:${r.journeyId}`;
    if (pairs.has(key))
      throw Error("Duplicate result for the same environment and journey.");
    pairs.add(key);
    if (typeof r.evidence !== "string" || r.evidence.length > 1000)
      throw Error("Invalid evidence reference.");
    const actual = text(
        r.actual,
        r.status === "not-applicable" ? "Exclusion reason" : "Observed result",
        2000,
      ),
      evidence =
        r.status === "not-applicable"
          ? r.evidence.trim()
          : text(r.evidence, "Evidence reference", 1000);
    if (
      typeof r.recordedAt !== "string" ||
      !Number.isFinite(Date.parse(r.recordedAt)) ||
      new Date(r.recordedAt).toISOString() !== r.recordedAt
    )
      throw Error("Invalid result timestamp.");
    return {
      environmentId: r.environmentId,
      journeyId: r.journeyId,
      status: r.status,
      actual,
      evidence,
      recordedAt: r.recordedAt,
    };
  });
  return { version: 1, name, environments, journeys, records };
}
export function matrixBackup(value) {
  const raw = JSON.stringify(normalize(value), null, 2);
  if (new TextEncoder().encode(raw).length > limit)
    throw Error(
      "Matrix exceeds the 256 KB backup budget. Shorten observations or use another matrix.",
    );
  return raw;
}
export function restoreMatrix(raw) {
  if (typeof raw !== "string" || new TextEncoder().encode(raw).length > limit)
    throw Error("Choose a matrix JSON backup up to 256 KB.");
  let value;
  try {
    value = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    throw Error("Matrix backup is not valid JSON.");
  }
  const clean = normalize(value);
  matrixBackup(clean);
  return clean;
}
export function createMatrix(name) {
  return normalize({
    version: 1,
    name,
    environments: [],
    journeys: [],
    records: [],
  });
}
function change(matrix, fn) {
  const next = structuredClone(matrix);
  fn(next);
  const clean = restoreMatrix(matrixBackup(next));
  Object.assign(matrix, clean);
}
export function addEnvironment(matrix, input) {
  change(matrix, (next) =>
    next.environments.push({
      id: `E-${next.environments.length + 1}`,
      name: input.name,
      build: input.build,
      browser: input.browser,
    }),
  );
}
export function addJourney(matrix, input) {
  change(matrix, (next) =>
    next.journeys.push({
      id: `J-${next.journeys.length + 1}`,
      name: input.name,
      expected: input.expected,
    }),
  );
}
export function recordMatrix(matrix, environmentId, journeyId, input) {
  change(matrix, (next) => {
    if (
      !next.environments.some((e) => e.id === environmentId) ||
      !next.journeys.some((j) => j.id === journeyId)
    )
      throw Error("Choose a valid environment and journey.");
    next.records = next.records.filter(
      (r) => r.environmentId !== environmentId || r.journeyId !== journeyId,
    );
    if (input.status !== "not-run")
      next.records.push({
        environmentId,
        journeyId,
        status: input.status,
        actual: input.actual,
        evidence: input.evidence,
        recordedAt: new Date().toISOString(),
      });
  });
}
export function matrixSummary(matrix) {
  const counts = Object.fromEntries(allowed.map((s) => [s, 0]));
  matrix.records.forEach((r) => counts[r.status]++);
  return {
    total: matrix.environments.length * matrix.journeys.length,
    notRun:
      matrix.environments.length * matrix.journeys.length -
      matrix.records.length,
    ...counts,
  };
}
export function matrixRows(matrix) {
  return matrix.environments.flatMap((e) =>
    matrix.journeys.map((j) => {
      const r = matrix.records.find(
        (r) => r.environmentId === e.id && r.journeyId === j.id,
      );
      return [
        matrix.name,
        e.name,
        e.build,
        e.browser,
        j.name,
        j.expected,
        r?.status || "not-run",
        r?.actual || "",
        r?.evidence || "",
        r?.recordedAt || "",
      ];
    }),
  );
}

const bytes = (s) => new TextEncoder().encode(s).length;
const pointer = (s) => s.replaceAll("~", "~0").replaceAll("/", "~1");

export function compareResponses(beforeText, afterText, ignoredText = "") {
  for (const text of [beforeText, afterText]) {
    if (typeof text !== "string" || bytes(text) > 262144)
      throw new Error("Each JSON input must be at most 256 KB.");
  }
  if (typeof ignoredText !== "string" || ignoredText.length > 4096)
    throw new Error("Ignore paths must be at most 4096 characters.");
  const ignored = [
    ...new Set(
      ignoredText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (
    ignored.length > 30 ||
    ignored.some((p) => !p.startsWith("/") || /~(?![01])/.test(p))
  )
    throw new Error(
      "Use up to 30 exact JSON Pointer paths, one per line; escape ~ as ~0 and / as ~1. Root cannot be ignored.",
    );
  let before, after;
  try {
    before = JSON.parse(beforeText);
    after = JSON.parse(afterText);
  } catch {
    throw new Error("Both responses must contain valid JSON.");
  }
  let nodes = 0;
  function validate(value, depth = 0) {
    if (++nodes > 20000 || depth > 40)
      throw new Error(
        "Responses exceed the combined 20,000-value or 40-level limit.",
      );
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("JSON numbers must be finite.");
    if (value && typeof value === "object")
      for (const child of Object.values(value)) validate(child, depth + 1);
  }
  validate(before);
  validate(after);
  const changes = [],
    matched = new Set();
  function add(kind, path, left, right) {
    if (changes.length >= 500)
      throw new Error(
        "More than 500 differences. Compare a smaller response; no partial report was produced.",
      );
    const change = { kind, path };
    if (kind !== "added") change.before = left;
    if (kind !== "removed") change.after = right;
    changes.push(change);
  }
  const type = (v) =>
    v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
  function walk(left, right, path, hasLeft = true, hasRight = true) {
    if (ignored.includes(path)) {
      matched.add(path);
      return;
    }
    if (!hasLeft) return add("added", path, undefined, right);
    if (!hasRight) return add("removed", path, left, undefined);
    if (type(left) !== type(right))
      return add("type changed", path, left, right);
    if (left !== null && typeof left === "object") {
      const keys = [
        ...new Set([...Object.keys(left), ...Object.keys(right)]),
      ].sort();
      for (const key of keys)
        walk(
          left[key],
          right[key],
          `${path}/${pointer(key)}`,
          Object.hasOwn(left, key),
          Object.hasOwn(right, key),
        );
    } else if (left !== right) add("changed", path, left, right);
  }
  walk(before, after, "");
  return {
    version: 1,
    comparison: "Offline user-supplied JSON; differences require human review",
    arrayMatching: "By index; reordered items can produce differences",
    ignoredPaths: ignored,
    matchedIgnoredPaths: [...matched],
    unmatchedIgnoredPaths: ignored.filter((p) => !matched.has(p)),
    changes,
  };
}

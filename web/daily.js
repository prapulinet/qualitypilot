import {
  STORY_FIELDS,
  storyReview,
  dataExamples,
  csv,
  selectRegression,
  playwrightResults,
  normalizeResults,
  compareResults,
  CHECKLISTS,
} from "/daily-model.js";

const root = document.querySelector('[data-panel="daily"]');
const el = (tag, value, cls) => {
  const n = document.createElement(tag);
  if (value !== undefined) n.textContent = value;
  if (cls) n.className = cls;
  return n;
};
const $ = (id) => root.querySelector(`#${id}`);
function save(value, name, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function field(
  form,
  label,
  name,
  { area = false, value = "", type = "text", ...attrs } = {},
) {
  const id = `${form.id}-${name}`;
  const l = el("label", label);
  l.htmlFor = id;
  const input = el(area ? "textarea" : "input");
  input.id = id;
  input.name = name;
  if (!area) input.type = type;
  input.value = value;
  for (const [k, v] of Object.entries(attrs)) input.setAttribute(k, v);
  form.append(l, input);
  return input;
}
function button(parent, label, fn, type = "button") {
  const b = el("button", label, "button subtle");
  b.type = type;
  if (fn) b.addEventListener("click", fn);
  parent.append(b);
  return b;
}
function card(id, title, description) {
  const d = el("details", undefined, "panel daily-tool");
  d.id = `daily-${id}`;
  const s = el("summary", title);
  d.append(s, el("p", description, "muted"));
  root.querySelector(".daily-tools").append(d);
  return d;
}
function output(parent, id) {
  const n = el("textarea");
  n.id = id;
  n.readOnly = true;
  n.setAttribute("aria-label", "Reviewable output");
  n.rows = 9;
  parent.append(n);
  return n;
}
function status(parent) {
  const n = el("p", "", "daily-status");
  n.setAttribute("role", "status");
  parent.append(n);
  return n;
}
function handoff(detail) {
  window.dispatchEvent(new CustomEvent("qp:bug-draft", { detail }));
  location.hash = "bugs";
}
root.append(el("div", undefined, "daily-tools"));

// All tool data remains in this tab. Downloads are explicit user actions.
const story = card(
  "story",
  "01 Story readiness",
  "Clarify requirements before drafting tests. This checklist does not interpret or approve a Jira story.",
);
story.open = true;
const sf = el("form");
sf.id = "daily-story-form";
story.append(sf);
field(sf, "Story or feature description", "story", {
  area: true,
  required: "",
  minlength: 10,
  maxlength: 12000,
});
for (const [key, label, question] of STORY_FIELDS)
  field(sf, `${label} — ${question}`, key, { area: true, maxlength: 12000 });
button(sf, "Review story", null, "submit");
const ss = status(story),
  so = output(story, "daily-story-output");
const se = button(story, "Download clarification report", () =>
  save(so.value, "story-review.txt"),
);
se.disabled = true;
sf.addEventListener("input", () => {
  se.disabled = true;
  ss.textContent = "Inputs changed. Review the story again.";
});
sf.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const r = storyReview(Object.fromEntries(new FormData(sf)));
    so.value = `STORY\n${r.story}\n\n${r.sections.map((s) => `${s.label}\n${s.answer || `NEEDS CLARIFICATION: ${s.question}`}`).join("\n\n")}\n\n${r.note}`;
    ss.textContent = `${r.unanswered} unanswered review areas. Confirm answers with the responsible people.`;
    se.disabled = false;
  } catch (err) {
    ss.textContent = err.message;
  }
});

const explore = card(
  "explore",
  "02 Exploratory session",
  "Timebox a testing mission. Record actual observations and evidence; draft a bug from a selected finding.",
);
const ef = el("form");
ef.id = "daily-explore-form";
explore.append(ef);
const mission = field(ef, "Testing mission", "mission", {
  required: "",
  maxlength: 1000,
});
const minutes = field(ef, "Timebox in minutes", "minutes", {
  type: "number",
  min: 1,
  max: 120,
  value: 20,
  required: "",
});
button(ef, "Start session", null, "submit");
const es = status(explore);
let session = null;
let ticker;
const observation = field(explore, "Observation", "observation", {
  area: true,
  maxlength: 4000,
});
const evidence = field(explore, "Evidence reference", "evidence", {
  maxlength: 1000,
});
const entries = el("select");
entries.id = "daily-finding";
entries.setAttribute("aria-label", "Recorded finding");
explore.append(entries);
const add = button(explore, "Record observation", () => {
  if (!session || session.ended) return;
  if (!observation.value.trim() || !evidence.value.trim()) {
    es.textContent = "Provide an observation and evidence reference.";
    return;
  }
  if (session.entries.length >= 100) {
    es.textContent =
      "Session limit: 100 observations. Export and start a new session.";
    return;
  }
  session.entries.push({
    at: new Date().toISOString(),
    observation: observation.value.trim(),
    evidence: evidence.value.trim(),
  });
  const option = el("option", observation.value.trim().slice(0, 100));
  option.value = session.entries.length - 1;
  entries.append(option);
  entries.value = option.value;
  observation.value = "";
  evidence.value = "";
  es.textContent = "Observation recorded locally.";
});
add.disabled = true;
const stop = button(explore, "End session", () => {
  if (!session) return;
  session.ended = new Date().toISOString();
  clearInterval(ticker);
  add.disabled = true;
  stop.disabled = true;
  es.textContent =
    "Session ended. Export your notes or draft a bug from a finding.";
});
stop.disabled = true;
button(explore, "Draft bug from finding", () => {
  const f = session?.entries[Number(entries.value)];
  if (!f) {
    es.textContent = "Record and select a finding first.";
    return;
  }
  handoff({
    issue: f.observation,
    actual: f.observation,
    evidence: f.evidence,
    steps: `Exploratory mission: ${session.mission}\nConfirm exact reproduction steps.`,
  });
});
button(explore, "Download session", () => {
  if (!session) {
    es.textContent = "Start a session first.";
    return;
  }
  save(
    JSON.stringify(session, null, 2),
    "exploratory-session.json",
    "application/json",
  );
});
ef.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!mission.value.trim()) {
    es.textContent = "Describe a testing mission first.";
    return;
  }
  if (session && !session.ended) {
    es.textContent = "End the current session before starting another.";
    return;
  }
  if (
    session &&
    !confirm(
      "Start a new session and replace these tab-local notes? Download first to keep them.",
    )
  )
    return;
  session = {
    mission: mission.value.trim(),
    started: new Date().toISOString(),
    minutes: Number(minutes.value),
    ended: null,
    entries: [],
  };
  entries.replaceChildren();
  add.disabled = false;
  stop.disabled = false;
  const update = () => {
    const left = Math.ceil(
      (Date.parse(session.started) + session.minutes * 60000 - Date.now()) /
        1000,
    );
    es.textContent =
      left > 0
        ? `Session active · ${Math.floor(left / 60)}m ${left % 60}s remaining`
        : "Timebox elapsed. Finish your notes and end the session.";
  };
  update();
  ticker = setInterval(update, 1000);
});

const visual = card(
  "visual",
  "03 Screenshot comparison",
  "Compare expected and actual UI locally. Click an image to place numbered markers, or use a centre marker with the keyboard. Markers are observations for human review.",
);
const vs = status(visual),
  images = el("div", undefined, "daily-images");
visual.append(images);
for (const side of ["Expected", "Actual"]) {
  const wrap = el("div");
  images.append(wrap);
  const uid = `daily-${side.toLowerCase()}`;
  const label = el("label", `${side} screenshot`);
  label.htmlFor = uid;
  const file = el("input");
  file.type = "file";
  file.id = uid;
  file.accept = "image/png,image/jpeg,image/webp";
  const canvas = el("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvas.hidden = true;
  canvas.setAttribute(
    "aria-label",
    `${side} screenshot with numbered annotations`,
  );
  const notes = el("textarea");
  notes.setAttribute("aria-label", `${side} marker note`);
  notes.maxLength = 500;
  notes.placeholder = "Describe the next marker";
  const list = el("ol");
  let bitmap,
    marks = [],
    generation = 0;
  const redraw = () => {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    marks.forEach((m, i) => {
      ctx.fillStyle = "#6547d5";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), m.x, m.y + 7);
    });
    list.replaceChildren(
      ...marks.map((m, i) => el("li", `${i + 1}: ${m.note}`)),
    );
  };
  const mark = (x, y) => {
    if (!bitmap) return;
    if (!notes.value.trim()) {
      vs.textContent = "Describe the marker before placing it.";
      return;
    }
    if (marks.length >= 30) {
      vs.textContent = "Limit: 30 markers per image.";
      return;
    }
    marks.push({ x, y, note: notes.value.trim() });
    notes.value = "";
    redraw();
    vs.textContent = `${side} marker added. Download the image and notes separately.`;
  };
  const viewport = el("div", undefined, "daily-image-viewport");
  viewport.tabIndex = 0;
  viewport.setAttribute("role", "region");
  viewport.setAttribute("aria-label", `${side} image pan area`);
  viewport.append(canvas);
  const zoomLabel = el("label", `${side} image zoom`);
  const zoom = el("select");
  zoom.id = `${uid}-zoom`;
  zoomLabel.htmlFor = zoom.id;
  for (const percent of [100, 150, 200]) {
    const option = el("option", `${percent}%`);
    option.value = percent;
    zoom.append(option);
  }
  zoom.addEventListener("change", () => {
    canvas.style.width = `${zoom.value}%`;
  });
  wrap.append(label, file, zoomLabel, zoom, viewport, notes, list);
  const center = button(wrap, `Mark centre of ${side.toLowerCase()}`, () =>
    mark(canvas.width / 2, canvas.height / 2),
  );
  center.disabled = true;
  const undo = button(wrap, `Undo ${side.toLowerCase()} marker`, () => {
    marks.pop();
    redraw();
  });
  undo.disabled = true;
  const download = button(
    wrap,
    `Download ${side.toLowerCase()} annotated image`,
    () =>
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = el("a");
        a.href = url;
        a.download = `${side.toLowerCase()}-annotated.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
  );
  download.disabled = true;
  const dn = button(wrap, `Download ${side.toLowerCase()} marker notes`, () =>
    save(
      marks
        .map(
          (m, i) =>
            `${i + 1}. ${m.note} (x=${Math.round(m.x)}, y=${Math.round(m.y)})`,
        )
        .join("\n"),
      `${side.toLowerCase()}-markers.txt`,
    ),
  );
  dn.disabled = true;
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    mark(
      ((e.clientX - r.left) * canvas.width) / r.width,
      ((e.clientY - r.top) * canvas.height) / r.height,
    );
  });
  file.addEventListener("change", async () => {
    const version = ++generation;
    bitmap?.close();
    bitmap = null;
    marks = [];
    list.replaceChildren();
    canvas.hidden = true;
    center.disabled = undo.disabled = download.disabled = dn.disabled = true;
    const f = file.files[0];
    if (!f) return;
    try {
      if (
        f.size > 8 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(f.type)
      )
        throw Error("Choose a PNG, JPEG or WebP up to 8 MB.");
      const img = await createImageBitmap(f);
      if (version !== generation) {
        img.close();
        return;
      }
      if (img.width * img.height > 16000000) {
        img.close();
        throw Error("Image exceeds 16 million pixels.");
      }
      bitmap = img;
      const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.hidden = false;
      center.disabled = undo.disabled = download.disabled = dn.disabled = false;
      redraw();
      vs.textContent =
        "Image loaded locally. Downloads use the displayed resolution (longest edge up to 1600 pixels).";
    } catch (err) {
      if (version === generation) vs.textContent = err.message;
    }
  });
}
const vf = el("form");
vf.id = "daily-visual-bug";
visual.append(vf);
field(vf, "Visual issue description", "issue", {
  required: "",
  maxlength: 4000,
  area: true,
});
button(vf, "Draft visual bug", null, "submit");
vf.addEventListener("submit", (e) => {
  e.preventDefault();
  handoff({
    issue: vf.elements.issue.value,
    actual: vf.elements.issue.value,
    evidence:
      "Attach the downloaded expected/actual annotated images and marker notes manually. Confirm the actual design reference.",
  });
});

const data = card(
  "data",
  "04 Test data builder",
  "Generate boundary data from confirmed inclusive rules. Text lengths use JavaScript UTF-16 code units. Other probes require product-specific expected results.",
);
const df = el("form");
df.id = "daily-data-form";
data.append(df);
const kl = el("label", "Rule type");
kl.htmlFor = "daily-kind";
const kind = el("select");
kind.id = "daily-kind";
kind.name = "kind";
for (const [v, t] of [
  ["integer", "Integer range"],
  ["text", "Text length"],
]) {
  const o = el("option", t);
  o.value = v;
  kind.append(o);
}
df.append(kl, kind);
field(df, "Inclusive minimum", "min", {
  type: "number",
  required: "",
  value: 1,
});
field(df, "Inclusive maximum", "max", {
  type: "number",
  required: "",
  value: 5,
});
button(df, "Generate test data", null, "submit");
const ds = status(data),
  dout = output(data, "daily-data-output");
let dataCSV = "";
const de = button(data, "Download test data CSV", () =>
  save(dataCSV, "test-data.csv", "text/csv"),
);
de.disabled = true;
df.addEventListener("input", () => {
  de.disabled = true;
  ds.textContent = "Rules changed. Generate the data again.";
});
df.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const rows = dataExamples(Object.fromEntries(new FormData(df)));
    dataCSV = csv([
      ["Purpose", "Value", "Expected behavior"],
      ...rows.map((r) => [r.purpose, r.value, r.expectation]),
    ]);
    dout.value = rows
      .map((r) => `${r.purpose}: ${JSON.stringify(r.value)}\n${r.expectation}`)
      .join("\n\n");
    de.disabled = false;
    ds.textContent = `${rows.length} probes prepared. CSV protects spreadsheet formula cells; use the displayed value for exact input.`;
  } catch (err) {
    de.disabled = true;
    ds.textContent = err.message;
  }
});

const regression = card(
  "regression",
  "05 Regression selection",
  "Select tests by explicit module/dependency tags. This is a declared mapping helper, not source-code impact analysis; unmatched cases still need human review.",
);
const rf = el("form");
rf.id = "daily-regression-form";
regression.append(rf);
field(rf, "Changed module tags separated by commas", "changed", {
  required: "",
  maxlength: 1000,
  value: "checkout",
});
field(rf, "Case catalogue JSON", "catalogue", {
  required: "",
  area: true,
  maxlength: 200000,
  value: JSON.stringify(
    [
      {
        id: "TC-01",
        title: "Checkout confirms an order",
        modules: ["checkout"],
        dependencies: ["cart", "session"],
      },
      {
        id: "TC-02",
        title: "Browse product catalogue",
        modules: ["catalogue"],
        dependencies: [],
      },
    ],
    null,
    2,
  ),
});
button(rf, "Suggest regression set", null, "submit");
const rs = status(regression),
  ro = output(regression, "daily-regression-output");
let rc = "";
const re = button(regression, "Download regression selection", () =>
  save(rc, "regression-selection.csv", "text/csv"),
);
re.disabled = true;
rf.addEventListener("input", () => {
  re.disabled = true;
  rs.textContent = "Mapping changed. Recompute the selection.";
});
rf.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const rows = selectRegression(
      JSON.parse(rf.elements.catalogue.value),
      rf.elements.changed.value,
    );
    ro.value = rows
      .map(
        (r) =>
          `${r.selected ? "SUGGESTED" : "REVIEW UNMAPPED"} · ${r.id} ${r.title}\n${r.reason}`,
      )
      .join("\n\n");
    rc = csv([
      ["ID", "Title", "Suggested", "Reason"],
      ...rows.map((r) => [r.id, r.title, r.selected, r.reason]),
    ]);
    re.disabled = false;
    rs.textContent = `${rows.filter((r) => r.selected).length}/${rows.length} cases suggested. Check mapping completeness and critical journeys.`;
  } catch (err) {
    re.disabled = true;
    rs.textContent = err.message;
  }
});

const reports = card(
  "reports",
  "06 Automation results inbox",
  "Import JUnit XML or Playwright JSON reporter output (up to 2 MB and 2000 tests). Compare matching identities across runs. Importing a report does not execute or authenticate its tests.",
);
const ps = status(reports);
let current = [],
  previous = [],
  reportName = "",
  versions = { current: 0, previous: 0 };
const summary = output(reports, "daily-report-output");
const failures = el("select");
failures.id = "daily-failed-test";
failures.setAttribute("aria-label", "Failed or flaky test");
function xmlResults(source) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source))
    throw Error("DTD and entity declarations are not supported.");
  const doc = new DOMParser().parseFromString(source, "application/xml");
  if (
    doc.querySelector("parsererror") ||
    !["testsuite", "testsuites"].includes(doc.documentElement.localName)
  )
    throw Error("Invalid JUnit XML.");
  return normalizeResults(
    [...doc.querySelectorAll("testcase")].map((c) => {
      const errors = [...c.children].filter((n) =>
        ["failure", "error", "flakyFailure", "rerunFailure"].includes(
          n.localName,
        ),
      );
      const skipped = [...c.children].some((n) => n.localName === "skipped");
      const failed = errors.some((n) =>
        ["failure", "error"].includes(n.localName),
      );
      if (skipped && errors.length)
        throw Error("A JUnit case cannot be both skipped and failed.");
      const suiteNames = [];
      let parent = c.parentElement;
      while (parent) {
        if (parent.localName === "testsuite")
          suiteNames.unshift(parent.getAttribute("name") || "");
        parent = parent.parentElement;
      }
      return {
        id: JSON.stringify([
          ...suiteNames,
          c.getAttribute("classname") || "",
          c.getAttribute("name") || "",
        ]),
        title: c.getAttribute("name") || "",
        status: skipped
          ? "skipped"
          : failed
            ? "failed"
            : errors.length
              ? "flaky"
              : "passed",
        duration: Number(c.getAttribute("time") || 0) * 1000,
        retries: errors.filter((n) =>
          ["flakyFailure", "rerunFailure"].includes(n.localName),
        ).length,
        error: errors
          .map((n) => n.textContent || n.getAttribute("message") || "")
          .join("\n")
          .slice(0, 12000),
      };
    }),
  );
}
function renderReports() {
  const rows = compareResults(current, previous);
  summary.value = rows
    .map(
      (r) =>
        `${r.status.toUpperCase()} · ${r.title}\n${r.duration} ms · ${r.retries} retries · ${r.change}${r.error ? `\n${r.error}` : ""}`,
    )
    .join("\n\n");
  failures.replaceChildren();
  rows.forEach((r, i) => {
    if (["failed", "flaky"].includes(r.status)) {
      const o = el("option", `${r.status}: ${r.title}`);
      o.value = i;
      failures.append(o);
    }
  });
  downloadReport.disabled = !current.length;
  draftReport.disabled = !failures.options.length;
  const removed = previous.filter(
    (p) => !current.some((c) => c.id === p.id),
  ).length;
  ps.textContent = current.length
    ? `${current.length} current tests: ${["passed", "failed", "flaky", "skipped"].map((s) => `${current.filter((r) => r.status === s).length} ${s}`).join(", ")}. ${removed} previous identities absent. Missing tests are not passes.`
    : "Load a current report. Failed imports clear that slot.";
}
for (const slot of ["current", "previous"]) {
  const l = el(
    "label",
    slot === "current" ? "Current report" : "Previous report (optional)",
  );
  const input = el("input");
  input.type = "file";
  input.accept = ".xml,.json";
  input.id = `daily-report-${slot}`;
  l.htmlFor = input.id;
  reports.append(l, input);
  input.addEventListener("change", async () => {
    const ver = ++versions[slot];
    if (slot === "current") {
      current = [];
      reportName = "";
    } else previous = [];
    renderReports();
    const f = input.files[0];
    if (!f) return;
    try {
      if (f.size > 2 * 1024 * 1024) throw Error("Report exceeds 2 MB.");
      const source = await f.text();
      if (ver !== versions[slot]) return;
      const rows = source.trimStart().startsWith("<")
        ? xmlResults(source)
        : playwrightResults(JSON.parse(source));
      if (slot === "current") {
        current = rows;
        reportName = f.name;
      } else previous = rows;
      renderReports();
    } catch (err) {
      if (ver === versions[slot])
        ps.textContent = `${slot} import failed: ${err.message}`;
    }
  });
}
reports.append(failures);
const draftReport = button(reports, "Draft bug from imported result", () => {
  const r = current[Number(failures.value)];
  if (!r || !["failed", "flaky"].includes(r.status)) return;
  handoff({
    issue: `${r.status} automated check: ${r.title}`,
    title: r.title.slice(0, 160),
    actual:
      r.error ||
      `Imported status: ${r.status}. Inspect the original report and reproduce.`,
    evidence: `Imported file: ${reportName}; identity: ${r.id}; ${r.retries} retries. User-supplied evidence; confirm environment and exact reproduction.`,
  });
});
draftReport.disabled = true;
const downloadReport = button(reports, "Download comparison CSV", () =>
  save(
    csv([
      [
        "Identity",
        "Title",
        "Status",
        "Duration ms",
        "Retries",
        "Change",
        "Error",
      ],
      ...compareResults(current, previous).map((r) => [
        r.id,
        r.title,
        r.status,
        r.duration,
        r.retries,
        r.change,
        r.error,
      ]),
    ]),
    "automation-comparison.csv",
    "text/csv",
  ),
);
downloadReport.disabled = true;

for (const [key, title, description] of [
  [
    "accessibility",
    "07 Accessibility walkthrough",
    "Record keyboard, zoom and assistive-technology observations. This partial checklist and automated axe scans do not certify WCAG conformance.",
  ],
  [
    "security",
    "08 Security review prompts",
    "Use only in an authorized test environment with agreed roles and harmless synthetic data. This guided review does not perform scans or certify security.",
  ],
]) {
  const section = card(key, title, description),
    records = [];
  const st = status(section);
  const reference = el(
    "a",
    key === "accessibility"
      ? "W3C evaluation guidance"
      : "OWASP Web Security Testing Guide",
  );
  reference.href =
    key === "accessibility"
      ? "https://www.w3.org/WAI/test-evaluate/"
      : "https://owasp.org/www-project-web-security-testing-guide/";
  reference.target = "_blank";
  reference.rel = "noreferrer";
  section.append(reference);
  for (const [i, [name, steps]] of CHECKLISTS[key].entries()) {
    const f = el("div", undefined, "daily-check");
    f.id = `daily-${key}-${i}`;
    section.append(f);
    f.append(el("h3", name), el("p", steps));
    const label = el("label", "Observed outcome");
    const result = el("select");
    result.id = `${f.id}-result`;
    label.htmlFor = result.id;
    for (const t of [
      "Not run",
      "Passed",
      "Failed",
      "Blocked",
      "Not applicable",
    ]) {
      const o = el("option", t);
      result.append(o);
    }
    f.append(label, result);
    const notes = field(f, "Observation or reason", "notes", {
        area: true,
        maxlength: 4000,
      }),
      ev = field(f, "Evidence reference", "evidence", { maxlength: 1000 });
    records.push({ name, steps, result, notes, ev });
    button(f, "Draft bug from this check", () => {
      if (
        result.value !== "Failed" ||
        !notes.value.trim() ||
        !ev.value.trim()
      ) {
        st.textContent =
          "Record a Failed outcome, observation and evidence reference first.";
        return;
      }
      handoff({
        issue: `${name}: ${notes.value}`,
        actual: notes.value,
        steps,
        evidence: ev.value,
      });
    });
  }
  button(section, "Download walkthrough", () => {
    if (
      records.some(
        (r) =>
          r.result.value !== "Not run" &&
          (!r.notes.value.trim() ||
            (r.result.value !== "Not applicable" && !r.ev.value.trim())),
      )
    ) {
      st.textContent =
        "Completed checks require observations and evidence; Not applicable requires a reason.";
      return;
    }
    save(
      csv([
        ["Check", "Guidance", "Outcome", "Observation", "Evidence"],
        ...records.map((r) => [
          r.name,
          r.steps,
          r.result.value,
          r.notes.value,
          r.ev.value,
        ]),
      ]),
      `${key}-walkthrough.csv`,
      "text/csv",
    );
    st.textContent =
      "Walkthrough downloaded. Not run and Not applicable checks remain explicit.";
  });
}

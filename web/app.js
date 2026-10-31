const $ = (selector) => document.querySelector(selector);
const state = {
  draft: null,
  drafts: [],
  runs: [],
  selectedRun: null,
  token: sessionStorage.getItem("qp-demo-token") || "",
  products: [],
  cart: { items: [], totalCents: 0 },
};
const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const date = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function notice(message) {
  $("#notice").textContent = message;
  $("#notice").hidden = !message;
}
async function api(path, { method = "GET", body, auth } = {}) {
  const response = await fetch(path, {
    method,
    signal: AbortSignal.timeout(90000),
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) throw Error(data.error || "Request failed.");
  return data;
}
function download(data, filename, type = "application/json") {
  const blob = new Blob(
    [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
    { type },
  );
  const url = URL.createObjectURL(blob);
  const link = element("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function navigate() {
  const view = ["workbench", "coverage", "runs", "shop", "guide"].includes(
    location.hash.slice(1),
  )
    ? location.hash.slice(1)
    : "workbench";
  for (const panel of document.querySelectorAll("[data-panel]"))
    panel.hidden = panel.dataset.panel !== view;
  document.querySelector(
    'section.metrics[aria-label="Latest execution metrics"]',
  ).hidden = view === "coverage";
  for (const link of document.querySelectorAll("[data-view]")) {
    if (link.dataset.view === view) {
      link.setAttribute("aria-current", "page");
      $("#current-view").textContent = link.textContent
        .trim()
        .replace(/^[^a-zA-Z]+/, "");
    } else link.removeAttribute("aria-current");
  }
  if (view === "runs") refreshRuns().catch((error) => notice(error.message));
  if (view === "shop") loadShop().catch((error) => notice(error.message));
}
window.addEventListener("hashchange", navigate);

function saveDrafts() {
  try {
    localStorage.setItem("qp-drafts-v1", JSON.stringify(state.drafts));
  } catch {
    notice("Browser storage is unavailable. Export your draft to keep a copy.");
  }
}
function loadDrafts() {
  try {
    const data = JSON.parse(localStorage.getItem("qp-drafts-v1") || "[]");
    state.drafts = Array.isArray(data)
      ? data
          .filter(
            (d) =>
              d &&
              typeof d.id === "string" &&
              typeof d.story === "string" &&
              typeof d.createdAt === "string" &&
              Array.isArray(d.scenarios) &&
              d.scenarios.length <= 20 &&
              d.scenarios.every(
                (s) =>
                  s &&
                  typeof s.title === "string" &&
                  typeof s.expected === "string" &&
                  Array.isArray(s.steps) &&
                  s.steps.every((step) => typeof step === "string"),
              ),
          )
          .slice(0, 8)
      : [];
  } catch {
    state.drafts = [];
  }
}
function renderHistory() {
  const root = $("#draft-history");
  root.replaceChildren();
  if (!state.drafts.length)
    return root.append(
      element(
        "p",
        "No saved drafts yet. Generate your first scenario draft.",
        "muted",
      ),
    );
  for (const draft of state.drafts) {
    const button = element("button", undefined, "history-item");
    const description = element("span", draft.story, "description");
    description.append(
      element("small", `${draft.source} · ${draft.scenarios.length} scenarios`),
    );
    const time = element("time", date(draft.createdAt));
    time.dateTime = draft.createdAt;
    button.append(description, time);
    button.addEventListener("click", () => {
      state.draft = draft;
      $("#story").value = draft.story;
      updateCount();
      renderDraft();
      $("#status").textContent = "Loaded a saved draft. Review before using.";
    });
    root.append(button);
  }
}
function renderDraft() {
  const draft = state.draft;
  $("#results").replaceChildren();
  $("#draft-count").textContent = `${draft.scenarios.length} drafts`;
  $("#export-draft").disabled = false;
  const reviewed = draft.scenarios.filter((s) => s.reviewed).length;
  $("#review-summary").textContent =
    `${reviewed} of ${draft.scenarios.length} reviewed · ${draft.source}`;
  for (const scenario of draft.scenarios) {
    const card = element("article");
    const top = element("div", undefined, "scenario-top");
    top.append(
      element("span", scenario.id, "scenario-id"),
      element("span", scenario.category || "AI draft", "scenario-category"),
    );
    const title = element("h4", scenario.title);
    const steps = element("ol");
    for (const step of scenario.steps) steps.append(element("li", step));
    const expected = element("p", `Expected: ${scenario.expected}`, "expected");
    const approve = element(
      "button",
      scenario.reviewed ? "✓ Reviewed · undo" : "Mark as reviewed",
      "approval",
    );
    approve.setAttribute("aria-pressed", String(Boolean(scenario.reviewed)));
    approve.setAttribute(
      "aria-label",
      `${scenario.reviewed ? "Undo review of" : "Mark as reviewed:"} ${scenario.title}`,
    );
    approve.addEventListener("click", () => {
      scenario.reviewed = !scenario.reviewed;
      draft.reviewRequired = draft.scenarios.some((s) => !s.reviewed);
      saveDrafts();
      // Keep keyboard focus stable during a review toggle.
      approve.textContent = scenario.reviewed
        ? "✓ Reviewed · undo"
        : "Mark as reviewed";
      approve.setAttribute("aria-pressed", String(scenario.reviewed));
      approve.setAttribute(
        "aria-label",
        `${scenario.reviewed ? "Undo review of" : "Mark as reviewed:"} ${scenario.title}`,
      );
      $("#review-summary").textContent =
        `${draft.scenarios.filter((s) => s.reviewed).length} of ${draft.scenarios.length} reviewed · ${draft.source}`;
    });
    card.append(top, title, steps, expected, approve);
    $("#results").append(card);
  }
}
const updateCount = () => {
  $("#character-count").textContent = `${$("#story").value.length} / 4000`;
};
$("#story").addEventListener("input", updateCount);
$("#mode").addEventListener("change", () => {
  $("#mode-help").textContent =
    $("#mode").value === "ai"
      ? "AI drafts require a configured gateway. Review all output against the actual acceptance criteria."
      : "Baseline drafts are generic review prompts. Adapt them to your acceptance criteria.";
});
$("#form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#generate").disabled = true;
  $("#status").textContent = "Generating…";
  try {
    const data = await api("/api/scenarios", {
      method: "POST",
      body: { story: $("#story").value, mode: $("#mode").value },
    });
    if (
      !Array.isArray(data.scenarios) ||
      !data.scenarios.length ||
      data.scenarios.some(
        (s) =>
          !s ||
          typeof s.title !== "string" ||
          !Array.isArray(s.steps) ||
          s.steps.some((step) => typeof step !== "string") ||
          typeof s.expected !== "string",
      )
    )
      throw Error("The response did not contain valid scenarios.");
    state.draft = {
      ...data,
      story: $("#story").value,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    state.drafts.unshift(state.draft);
    state.drafts = state.drafts.slice(0, 8);
    saveDrafts();
    renderDraft();
    renderHistory();
    $("#status").textContent =
      `${data.scenarios.length} drafts · ${data.source} · review required`;
  } catch (error) {
    $("#status").textContent = error.message;
  } finally {
    $("#generate").disabled = false;
  }
});
$("#export-draft").addEventListener("click", () =>
  download(state.draft, `qualitypilot-draft-${state.draft.id}.json`),
);
$("#clear-history").addEventListener("click", () => {
  state.drafts = [];
  saveDrafts();
  renderHistory();
  $("#status").textContent =
    "Local draft history cleared. The current draft remains available until you leave this page.";
});

async function refreshRuns() {
  state.runs = (await api("/api/runs")).runs;
  $("#metric-runs").textContent = state.runs.length;
  const latest = state.runs[0];
  if (latest) {
    $("#metric-rate").textContent =
      `${Math.round((latest.passed / latest.total) * 100)}%`;
    $("#metric-total").textContent = latest.total;
    $("#metric-rate-note").textContent =
      `${latest.passed} passed · ${latest.failed} failed · ${latest.suite}`;
  }
  const root = $("#run-history");
  root.replaceChildren();
  if (!state.runs.length)
    return root.append(
      element("p", "No runs yet. Execute a suite to begin.", "muted"),
    );
  for (const run of state.runs) {
    const button = element("button", undefined, "history-item");
    const description = element(
      "span",
      `${run.suite.charAt(0).toUpperCase() + run.suite.slice(1)} suite`,
    );
    description.append(
      element("small", `${date(run.createdAt)} · ${run.durationMs} ms`),
    );
    button.append(
      description,
      element(
        "span",
        `${run.passed}/${run.total} passed`,
        `result-pill ${run.failed ? "failed" : "passed"}`,
      ),
    );
    button.addEventListener("click", () =>
      selectRun(run).catch((error) => notice(error.message)),
    );
    root.append(button);
  }
}
async function selectRun(run) {
  state.selectedRun = run;
  $("#export-run").disabled = false;
  const root = $("#run-results");
  root.replaceChildren();
  const summary = element("div", undefined, "result-summary");
  for (const [label, style] of [
    [`${run.passed} passed`, "passed"],
    [`${run.failed} failed`, run.failed ? "failed" : ""],
    [`${run.durationMs} ms`, ""],
  ])
    summary.append(element("span", label, `result-pill ${style}`));
  root.append(summary);
  for (const result of run.results) {
    const row = element(
      "div",
      undefined,
      `result-row ${result.status === "failed" ? "failure" : ""}`,
    );
    row.append(
      element("span", result.status === "passed" ? "✓" : "×", "result-icon"),
      element("span", result.name),
      element("small", `${result.durationMs} ms`),
    );
    if (result.error) row.append(element("pre", result.error));
    root.append(row);
  }
  $("#run-analysis").replaceChildren();
  const analysis = await api(`/api/runs/${run.id}/analysis`);
  if (state.selectedRun?.id !== run.id) return;
  const target = $("#run-analysis");
  target.append(
    element("span", "Rule-based triage · human review", "tag"),
    element("h4", analysis.summary),
  );
  for (const finding of analysis.findings) {
    target.append(element("p", finding.hypothesis));
    const list = element("ul");
    for (const step of finding.nextSteps) list.append(element("li", step));
    target.append(list);
  }
}
$("#run-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#run-suite").disabled = true;
  $("#run-status").textContent = "Executing isolated HTTP checks…";
  notice("");
  try {
    const run = await api("/api/runs", {
      method: "POST",
      body: { suite: $("#suite").value },
    });
    await refreshRuns();
    await selectRun(run);
    $("#run-status").textContent =
      `Completed · ${run.passed} passed · ${run.failed} failed${run.diagnostic ? " · intentional diagnostic exercise" : ""}`;
  } catch (error) {
    $("#run-status").textContent = error.message;
  } finally {
    $("#run-suite").disabled = false;
  }
});
$("#export-run").addEventListener("click", () =>
  download(state.selectedRun, `qualitypilot-run-${state.selectedRun.id}.json`),
);

async function loadShop() {
  if (!state.products.length)
    state.products = (await api("/api/demo/products")).products;
  if (state.token) {
    try {
      state.cart = await api("/api/demo/cart", { auth: state.token });
    } catch {
      state.token = "";
      sessionStorage.removeItem("qp-demo-token");
      state.cart = { items: [], totalCents: 0 };
      $("#shop-status").textContent =
        "Your demo session expired. Sign in again.";
    }
  }
  renderShop();
}
function renderShop() {
  $("#demo-login").hidden = Boolean(state.token);
  $("#demo-logout").hidden = !state.token;
  $("#clear-cart").disabled = !state.cart.items.length;
  $("#checkout").disabled = !state.cart.items.length;
  const root = $("#products");
  root.replaceChildren();
  for (const product of state.products) {
    const card = element("article", undefined, "product");
    const art = element("div", product.icon, "product-visual");
    art.setAttribute("aria-hidden", "true");
    const bottom = element("div", undefined, "product-bottom");
    const add = element("button", "Add to cart +", "button subtle");
    add.disabled = !state.token;
    add.setAttribute("aria-label", `Add ${product.name} to cart`);
    add.addEventListener("click", async () => {
      add.disabled = true;
      try {
        const quantity =
          (state.cart.items.find((p) => p.id === product.id)?.quantity || 0) +
          1;
        state.cart = await api("/api/demo/cart", {
          method: "POST",
          auth: state.token,
          body: { productId: product.id, quantity },
        });
        $("#shop-status").textContent = `${product.name} added to cart.`;
        $("#order-result").hidden = true;
        renderShop();
      } catch (error) {
        $("#shop-status").textContent = error.message;
        add.disabled = false;
      }
    });
    bottom.append(element("strong", money(product.priceCents)), add);
    card.append(
      art,
      element("small", product.category),
      element("h3", product.name),
      bottom,
    );
    root.append(card);
  }
  const cart = $("#cart-items");
  cart.replaceChildren();
  if (!state.cart.items.length)
    cart.append(
      element(
        "p",
        state.token
          ? "Your cart is empty. Add a product to get started."
          : "Sign in to start your demo cart.",
        "muted small-text",
      ),
    );
  for (const item of state.cart.items) {
    const line = element("div", undefined, "cart-line");
    line.append(
      element("span", `${item.name} × ${item.quantity}`),
      element("strong", money(item.priceCents * item.quantity)),
    );
    cart.append(line);
  }
  $("#cart-total").textContent = money(state.cart.totalCents);
}
$("#demo-login").addEventListener("click", async () => {
  $("#demo-login").disabled = true;
  try {
    const session = await api("/api/demo/session", {
      method: "POST",
      body: { email: "qa@qualitypilot.test", password: "TestOnly!123" },
    });
    state.token = session.token;
    sessionStorage.setItem("qp-demo-token", state.token);
    $("#shop-status").textContent = "Signed in to an isolated demo session.";
    await loadShop();
  } catch (error) {
    $("#shop-status").textContent = error.message;
  } finally {
    $("#demo-login").disabled = false;
  }
});
$("#demo-logout").addEventListener("click", async () => {
  try {
    await api("/api/demo/session", { method: "DELETE", auth: state.token });
  } catch (error) {
    notice(error.message);
  }
  state.token = "";
  state.cart = { items: [], totalCents: 0 };
  sessionStorage.removeItem("qp-demo-token");
  $("#order-result").hidden = true;
  $("#shop-status").textContent = "Signed out.";
  renderShop();
});
$("#clear-cart").addEventListener("click", async () => {
  try {
    state.cart = await api("/api/demo/cart", {
      method: "DELETE",
      auth: state.token,
    });
    renderShop();
    $("#shop-status").textContent = "Cart cleared.";
  } catch (error) {
    $("#shop-status").textContent = error.message;
  }
});
$("#checkout").addEventListener("click", async () => {
  $("#checkout").disabled = true;
  try {
    const order = await api("/api/demo/checkout", {
      method: "POST",
      auth: state.token,
      body: { idempotencyKey: crypto.randomUUID() },
    });
    state.cart = { items: [], totalCents: 0 };
    renderShop();
    $("#order-result").textContent =
      `✓ Demo order confirmed · ${order.id} · ${money(order.totalCents)} · No payment processed.`;
    $("#order-result").hidden = false;
    $("#shop-status").textContent =
      "Checkout complete. Your cart is now empty.";
  } catch (error) {
    $("#shop-status").textContent = error.message;
    $("#checkout").disabled = false;
  }
});

loadDrafts();
renderHistory();
updateCount();
navigate();
api("/api/health")
  .then((health) => {
    $("#metric-ai").textContent = health.aiConfigured ? "AI ready" : "Baseline";
  })
  .catch((error) => {
    $("#metric-ai").textContent = "Offline";
    notice(error.message);
  });
refreshRuns().catch((error) => notice(error.message));

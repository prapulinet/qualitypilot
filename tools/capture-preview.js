import { mkdir, writeFile } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";
import { createServer } from "../src/server.js";
import {
  createWorkspace,
  addRequirement,
  addCase,
  reviewCase,
  startRun,
  recordResult,
  linkDefect,
  backup,
} from "../web/workspace-model.js";

const server = createServer({ endpoint: "", token: "" });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir("docs/images", { recursive: true });
await mkdir("docs/evidence", { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1250 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.locator("#metric-ai").filter({ hasText: "Baseline" }).waitFor();
  await page.screenshot({ path: "docs/images/overview.png", fullPage: false });
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await page.locator("#results article").first().waitFor();
  await page
    .getByRole("button", {
      name: "Mark as reviewed: Complete the primary workflow",
      exact: true,
    })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/images/workbench.png", fullPage: true });
  await page.goto(`${base}/#runs`);
  await page.getByRole("button", { name: "Run suite", exact: true }).click();
  await page.locator("#run-status").filter({ hasText: "Completed" }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/images/test-lab.png", fullPage: true });
  const latest = await (await context.request.get(`${base}/api/runs`)).json();
  await writeFile(
    "docs/evidence/regression-run.json",
    JSON.stringify(latest.runs[0], null, 2) + "\n",
  );
  await page.goto(`${base}/#shop`);
  await page.locator("#products article").first().waitFor();
  await page.screenshot({ path: "docs/images/demo-store.png", fullPage: true });
  await page.goto(`${base}/#coverage`);
  await page.getByRole("button", { name: "Build coverage plan" }).click();
  await page.getByLabel("Impact · AC-1").selectOption("5");
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector('[data-panel="coverage"]').offsetTop - 24,
    ),
  );
  await page.screenshot({
    path: "docs/images/coverage-planner.png",
    fullPage: false,
  });
  await page.goto(`${base}/#bugs`);
  await page
    .getByLabel("Observed issue", { exact: true })
    .fill(
      "Synthetic example: profile name changes disappear after refreshing the page.",
    );
  await page
    .getByLabel("Expected result / acceptance criterion")
    .fill("AC-2: the saved display name remains after a page refresh.");
  await page
    .getByLabel("Reproduction steps · one per line")
    .fill(
      "Open the test profile\nChange the display name\nSelect Save\nRefresh the page",
    );
  await page.getByRole("button", { name: "Prepare bug report" }).click();
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector('[data-panel="bugs"]').offsetTop - 24,
    ),
  );
  await page.screenshot({
    path: "docs/images/bug-builder.png",
    fullPage: false,
  });
  const project = createWorkspace("SYNTHETIC — account release demo");
  const requirement = addRequirement(
    project,
    "Profile changes remain after refresh.",
    5,
    4,
  );
  const design = addCase(project, {
    requirementId: requirement.id,
    title: "Persist updated display name",
    steps: "Edit the test name, save, refresh",
    expected: "Updated test name remains",
  });
  reviewCase(project, design.id);
  const initial = startRun(project, "Synthetic initial session");
  recordResult(project, initial.id, design.id, {
    status: "failed",
    actual: "Synthetic example: old name returned",
    evidence: "SYNTHETIC-initial-example",
  });
  linkDefect(project, initial.id, design.id, {
    title: "Synthetic name persistence defect",
    severity: "Major",
  });
  const retest = startRun(project, "Synthetic retest session");
  recordResult(project, retest.id, design.id, {
    status: "passed",
    actual: "Synthetic example: new name remained",
    evidence: "SYNTHETIC-retest-example",
  });
  const fixtureBackup = backup([project]);
  await writeFile("docs/evidence/workspace-example.json", fixtureBackup + "\n");
  await page.goto(`${base}/#workspace`);
  await page.getByText("Restore a workspace backup", { exact: true }).click();
  await page.getByLabel("Workspace JSON backup · max 2 MB").setInputFiles({
    name: "example.json",
    mimeType: "application/json",
    buffer: Buffer.from(fixtureBackup),
  });
  await page
    .getByRole("checkbox", {
      name: "I understand restoring replaces the current in-memory project collection.",
    })
    .check();
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await page.locator("#workspace-detail details").evaluateAll((nodes) =>
    nodes.forEach((node) => {
      node.open = false;
    }),
  );
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector('[data-panel="workspace"]').offsetTop - 24,
    ),
  );
  await page.screenshot({
    path: "docs/images/qa-workspace.png",
    fullPage: false,
  });
  await page.locator("#workspace-execution").evaluate((node) => {
    node.closest("details").open = true;
  });
  await page
    .getByLabel("Inspect execution session", { exact: true })
    .selectOption(initial.id);
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector("#workspace-execution").closest("details")
        .offsetTop - 24,
    ),
  );
  await page.screenshot({
    path: "docs/images/execution-evidence.png",
    fullPage: false,
  });
  const mobile = await browser.newContext({
    ...devices["Pixel 7"],
    deviceScaleFactor: 1,
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(base);
  await mobilePage.screenshot({
    path: "docs/images/mobile.png",
    fullPage: true,
  });
  await mobile.close();
  await context.close();
  console.log("Captured desktop/mobile previews and an actual regression run.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

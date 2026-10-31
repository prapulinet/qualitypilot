import { mkdir, writeFile } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";
import { createServer } from "../src/server.js";

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

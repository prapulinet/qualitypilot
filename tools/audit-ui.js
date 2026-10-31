import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "../src/server.js";

const server = createServer({ endpoint: "", token: "" });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  for (const view of [
    "workbench",
    "coverage",
    "bugs",
    "runs",
    "shop",
    "guide",
  ]) {
    await page.goto(`http://127.0.0.1:${server.address().port}/#${view}`);
    if (view === "shop")
      await page.locator("#products article").first().waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    console.log(
      JSON.stringify(
        {
          view,
          violations: result.violations.map((v) => ({
            rule: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        },
        null,
        2,
      ),
    );
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

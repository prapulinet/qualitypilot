import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createServer } from "../src/server.js";
const server = createServer({ endpoint: "", token: "" });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1250 },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/#daily`);
  await page.locator("#daily-story-form").waitFor();
  await page
    .locator(".daily-tool")
    .evaluateAll((nodes) => nodes.forEach((n) => (n.open = false)));
  await page
    .locator('[data-panel="daily"]')
    .evaluate((n) => window.scrollTo(0, n.offsetTop - 24));
  await mkdir("docs/images", { recursive: true });
  await page.screenshot({ path: "docs/images/daily-workbench.png" });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

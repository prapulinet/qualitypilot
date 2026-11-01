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
  await page.goto(`http://127.0.0.1:${server.address().port}/#launch`);
  await page.locator("#launch-plan-form").waitFor();
  await page.locator("#launch-compatibility").waitFor({ state: "attached" });
  await page
    .locator('[data-panel="launch"] > details')
    .evaluateAll((nodes) => nodes.forEach((n) => (n.open = false)));
  await mkdir("docs/images", { recursive: true });
  await page
    .locator('[data-panel="launch"]')
    .screenshot({ path: "docs/images/qa-launchpad.png" });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

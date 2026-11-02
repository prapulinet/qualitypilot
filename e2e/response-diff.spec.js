import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";

async function open(page) {
  await page.goto("/#launch");
  await page.locator("#launch-response-diff > summary").click();
}
test("offline comparison exports real differences and invalidates stale evidence", async ({
  page,
}) => {
  await open(page);
  const root = page.locator("#launch-response-diff");
  await page
    .getByLabel("Before JSON response", { exact: true })
    .fill('{"total":100,"timestamp":1}');
  await page
    .getByLabel("After JSON response", { exact: true })
    .fill('{"total":120,"timestamp":2}');
  await page.locator("#diff-ignored").fill("/timestamp\n/missing");
  await root
    .getByRole("button", { name: "Compare JSON responses", exact: true })
    .click();
  await expect(root.getByRole("status")).toContainText(
    "1 differences · 1 ignore paths matched · 1 ignore paths unmatched",
  );
  await expect(
    root.getByRole("heading", { name: "changed: /total", exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await root
    .getByRole("button", { name: "Download JSON comparison", exact: true })
    .click();
  const download = await pending;
  const { readFile } = await import("node:fs/promises");
  const report = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(report.changes).toEqual([
    { kind: "changed", path: "/total", before: 100, after: 120 },
  ]);
  await page.locator("#diff-after").fill("bad");
  await expect(
    root.getByRole("button", { name: "Download JSON comparison", exact: true }),
  ).toBeDisabled();
  await expect(root.locator("article")).toHaveCount(0);
  await root
    .getByRole("button", { name: "Compare JSON responses", exact: true })
    .click();
  await expect(root.getByRole("status")).toContainText("valid JSON");
});

test("comparison renders untrusted text safely and fits accessible desktop/mobile controls", async ({
  page,
}) => {
  await open(page);
  const root = page.locator("#launch-response-diff");
  await page.locator("#diff-before").fill('{"value":"old"}');
  await page.locator("#diff-after").fill(
    JSON.stringify({
      value: '<img src=x onerror="window.diffInjected=true">',
    }),
  );
  await root
    .getByRole("button", { name: "Compare JSON responses", exact: true })
    .click();
  await expect(root.locator("pre")).toContainText("<img");
  expect(await page.evaluate(() => window.diffInjected)).toBeUndefined();
  expect(
    (await new AxeBuilder({ page }).include("#launch-response-diff").analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

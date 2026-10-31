import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/#coverage");
});

test("builds criterion-linked drafts with accessible risk controls", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Build coverage plan" }).click();
  await expect(page.locator(".coverage-card")).toHaveCount(2);
  await expect(page.locator("#coverage-reviewed")).toHaveText("0/6");
  await page.getByLabel("Impact · AC-1").selectOption("5");
  await expect(page.locator("#coverage-gaps")).toHaveText("1");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});
test("manual outcome cannot be saved without evidence; valid evidence persists", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Build coverage plan" }).click();
  await page.getByLabel("Manual result · AC-1-TC-1").selectOption("passed");
  await page
    .getByRole("button", { name: "Save result AC-1-TC-1", exact: true })
    .click();
  await expect(page.locator("#coverage-status")).toContainText(
    "Add an evidence note",
  );
  await expect(page.locator("#coverage-passed")).toHaveText("0/6");
  await page
    .getByLabel("Evidence · AC-1-TC-1", { exact: true })
    .fill("Observed valid sign-in. Evidence: manual-run-001.");
  await page
    .getByRole("button", { name: "Save result AC-1-TC-1", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("#coverage-passed")).toHaveText("1/6");
  await expect(
    page.getByLabel("Evidence · AC-1-TC-1", { exact: true }),
  ).toHaveValue("Observed valid sign-in. Evidence: manual-run-001.");
});
test("high-risk gap closes only after review and passing evidence for every planned check", async ({
  page,
}) => {
  await page
    .getByLabel("Acceptance criteria · one per line")
    .fill("Customers can view only their own order details.");
  await page.getByRole("button", { name: "Build coverage plan" }).click();
  await page.getByLabel("Impact · AC-1").selectOption("5");
  await expect(page.locator("#coverage-gaps")).toHaveText("1");
  for (let i = 1; i <= 3; i++) {
    await page
      .getByLabel(`Design reviewed · AC-1-TC-${i}`, { exact: true })
      .check();
    await page
      .getByLabel(`Evidence · AC-1-TC-${i}`, { exact: true })
      .fill(`Expected behavior confirmed in manual check ${i}.`);
    await page
      .getByLabel(`Manual result · AC-1-TC-${i}`)
      .selectOption("passed");
    await page
      .getByRole("button", { name: `Save result AC-1-TC-${i}`, exact: true })
      .click();
  }
  await expect(page.locator("#coverage-gaps")).toHaveText("0");
  await expect(page.locator("#coverage-verdict")).toContainText(
    "not an automated release approval",
  );
});
test("long criteria stay in the viewport and CSV export is safe", async ({
  page,
}) => {
  await page
    .getByLabel("Acceptance criteria · one per line")
    .fill('=HYPERLINK("https://example.test") ' + "reference-".repeat(15));
  await page.getByRole("button", { name: "Build coverage plan" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const stream = await (await pending).createReadStream();
  const csv = Buffer.concat(await stream.toArray()).toString();
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("AC-1-TC-3");
});

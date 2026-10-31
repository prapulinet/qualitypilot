import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";

test("review state persists and JSON export contains the actual review", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Mark as reviewed: Complete the primary workflow",
      exact: true,
    })
    .click();
  await expect(page.locator("#review-summary")).toContainText(
    "1 of 4 reviewed",
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloaded;
  const content = await (await download.createReadStream()).toArray();
  const draft = JSON.parse(Buffer.concat(content).toString());
  expect(draft.source).toBe("baseline");
  expect(draft.scenarios[0].reviewed).toBe(true);
  await page.reload();
  await page.locator("#draft-history button").first().click();
  await expect(
    page.getByRole("button", {
      name: "Undo review of Complete the primary workflow",
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("regression run renders genuine results and downloadable evidence", async ({
  page,
}) => {
  await page.goto("/#runs");
  await page.getByRole("button", { name: "Run suite", exact: true }).click();
  await expect(page.locator("#run-status")).toContainText(
    "12 passed · 0 failed",
  );
  await expect(page.locator("#run-results .result-row")).toHaveCount(12);
  await expect(page.locator("#metric-rate")).toHaveText("100%");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const download = await downloaded;
  const content = await (await download.createReadStream()).toArray();
  const report = JSON.parse(Buffer.concat(content).toString());
  expect(report.source).toBe("live-local-http");
  expect(report.total).toBe(12);
  expect(report.failed).toBe(0);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("diagnostic exercise makes failure provenance and triage explicit", async ({
  page,
}) => {
  await page.goto("/#runs");
  await page.getByLabel("Test suite").selectOption("diagnostic");
  await page.getByRole("button", { name: "Run suite", exact: true }).click();
  await expect(page.locator("#run-status")).toContainText(
    "intentional diagnostic exercise",
  );
  await expect(page.locator("#run-results .failure")).toHaveCount(1);
  await expect(page.locator("#run-analysis")).toContainText(
    "Rule-based triage",
  );
  await expect(page.locator("#run-analysis")).toContainText("deliberately");
});

test("commerce sign-in, add, checkout and sign-out work end to end", async ({
  page,
}) => {
  await page.goto("/#shop");
  await page
    .getByRole("button", { name: "Sign in to demo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Add Orbit mechanical keyboard to cart",
      exact: true,
    })
    .click();
  await expect(page.locator("#cart-total")).toHaveText("$89.00");
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(page.locator("#order-result")).toContainText(
    "No payment processed",
  );
  await expect(page.locator("#cart-total")).toHaveText("$0.00");
  await expect(
    page.getByRole("button", { name: "Place demo order", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in to demo", exact: true }),
  ).toBeVisible();
});

test("cart quantity limit is visible and preserves the last valid total", async ({
  page,
}) => {
  await page.goto("/#shop");
  await page
    .getByRole("button", { name: "Sign in to demo", exact: true })
    .click();
  for (let i = 1; i <= 5; i++) {
    await page
      .getByRole("button", { name: "Add Arc desk lamp to cart", exact: true })
      .click();
    await expect(page.locator("#cart-total")).toHaveText(`$${49 * i}.00`);
  }
  await page
    .getByRole("button", { name: "Add Arc desk lamp to cart", exact: true })
    .click();
  await expect(page.locator("#shop-status")).toContainText(
    "Quantity must be an integer from 1 to 5",
  );
  await expect(page.locator("#cart-total")).toHaveText("$245.00");
});

for (const view of ["runs", "shop", "guide"]) {
  test(`${view} view is accessible and fits the viewport`, async ({ page }) => {
    await page.goto(`/#${view}`);
    await expect(page.locator(`[data-panel="${view}"]`)).toBeVisible();
    if (view === "shop")
      await expect(page.locator("#products article")).toHaveCount(3);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("generates a real baseline draft and identifies its source", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("4 drafts");
  await expect(page.locator("#results article")).toHaveCount(4);
  await expect(page.locator("#results")).toContainText("Reject invalid input");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("AI unavailability is actionable and recoverable", async ({ page }) => {
  await page.getByLabel("Generation mode").selectOption("ai");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("not configured");
  await expect(
    page.getByRole("button", { name: "Generate draft", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Generation mode").selectOption("baseline");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.locator("#results article")).toHaveCount(4);
});

test("invalid requirement never submits an API request", async ({ page }) => {
  let submitted = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/scenarios")) submitted = true;
  });
  await page
    .getByRole("textbox", { name: "User story", exact: true })
    .fill("short");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  expect(submitted).toBe(false);
  await expect(
    page.getByRole("textbox", { name: "User story", exact: true }),
  ).toBeFocused();
});

test("renders provider text safely without executing markup", async ({
  page,
}) => {
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({
      json: {
        source: "ai",
        reviewRequired: true,
        scenarios: [
          {
            id: "AI-1",
            title: '<img src=x onerror="window.injected=true">',
            steps: ["<script>alert(1)</script>"],
            expected: "No execution",
          },
        ],
      },
    }),
  );
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.locator("#results")).toContainText("<img");
  await expect(page.locator("#results img")).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test("initial workbench passes automated accessibility checks", async ({
  page,
}) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("fits the viewport and supports keyboard operation", async ({ page }) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("textbox", { name: "User story", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Generation mode")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Generate draft", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#results article")).toHaveCount(4);
});

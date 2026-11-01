import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
async function setup(page) {
  await page.goto("/#launch");
  await page.locator("#launch-compatibility > summary").click();
  await page
    .getByLabel("New compatibility scope", { exact: true })
    .fill("Synthetic checkout compatibility");
  await page
    .getByRole("button", { name: "Create compatibility matrix", exact: true })
    .click();
  await page
    .getByLabel("Environment name", { exact: true })
    .fill("Synthetic staging");
  await page.getByLabel("Build identifier", { exact: true }).fill("B-001");
  await page
    .getByLabel("Browser version and OS or device", { exact: true })
    .fill("Synthetic Chrome / Windows 11");
  await page
    .getByRole("button", { name: "Add environment/build", exact: true })
    .click();
  await page
    .getByLabel("Compatibility journey name", { exact: true })
    .fill("Checkout");
  await page
    .getByLabel("Confirmed journey expected behavior", { exact: true })
    .fill("Confirmed synthetic outcome: order reference is visible.");
  await page
    .getByRole("button", { name: "Add compatibility journey", exact: true })
    .click();
}
test("compatibility evidence validation, exports and failed context handoff work", async ({
  page,
}) => {
  await setup(page);
  const row = page.locator("#matrix-E-1-J-1");
  await row.locator("select").selectOption("failed");
  await row
    .getByRole("button", { name: "Save matrix outcome", exact: true })
    .click();
  await expect(page.locator("#launch-compatibility")).toContainText(
    "Observed result is required",
  );
  await row
    .getByLabel("Observed result or exclusion reason", { exact: true })
    .fill("Synthetic order reference is missing.");
  await row
    .getByLabel("Evidence reference for executed or blocked checks", {
      exact: true,
    })
    .fill("SYNTHETIC-capture-01");
  await row
    .getByRole("button", { name: "Save matrix outcome", exact: true })
    .click();
  await expect(page.locator("#launch-compatibility")).toContainText("1 Failed");
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download compatibility CSV", exact: true })
    .click();
  expect((await dl).suggestedFilename()).toBe("compatibility-matrix.csv");
  await row
    .getByRole("button", { name: "Draft compatibility bug", exact: true })
    .click();
  await expect(page).toHaveURL(/#bugs$/);
  await expect(page.locator('#bug-form [name="evidence"]')).toHaveValue(
    /B-001/,
  );
  await expect(page.locator('#bug-form [name="actual"]')).toHaveValue(
    "Synthetic order reference is missing.",
  );
});
test("bad compatibility imports preserve the matrix and expanded controls are accessible", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByLabel("Restore compatibility JSON · maximum 256 KB", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":1,"name":"bad"}'),
    });
  await expect(page.locator("#launch-compatibility")).toContainText(
    "current matrix preserved",
  );
  await expect(page.locator("#matrix-E-1-J-1")).toContainText("B-001");
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download compatibility backup", exact: true })
    .click();
  expect((await dl).suggestedFilename()).toBe("compatibility-matrix.json");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

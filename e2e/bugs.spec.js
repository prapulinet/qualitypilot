import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/#bugs");
});
test("copy uses the reviewed text and falls back to selection when clipboard access fails", async ({
  page,
}) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedBugReport = text;
        },
      },
    }),
  );
  await page
    .getByLabel("Observed issue", { exact: true })
    .fill("Synthetic example: profile changes disappear after refresh.");
  await page.getByRole("button", { name: "Prepare bug report" }).click();
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  expect(await page.evaluate(() => window.copiedBugReport)).toBe(
    await page.locator("#bug-output").inputValue(),
  );
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw Error("permission denied");
    };
  });
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  await expect(page.locator("#bug-status")).toContainText("press Ctrl+C");
  expect(
    await page
      .locator("#bug-output")
      .evaluate(
        (el) => el.selectionEnd - el.selectionStart === el.value.length,
      ),
  ).toBe(true);
});
test("issue-only draft flags missing expected results and never posts bug data", async ({
  page,
}) => {
  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page
    .getByLabel("Observed issue", { exact: true })
    .fill("Save reports success but my edits disappear after refresh.");
  await page.getByRole("button", { name: "Prepare bug report" }).click();
  await expect(page.locator("#bug-output")).toHaveValue(
    /Needs confirmation: expected behavior/,
  );
  await expect(page.locator("#bug-completeness")).toContainText("6 details");
  expect(posts).toEqual([]);
  await page
    .getByLabel("Expected result / acceptance criterion")
    .fill("The saved value persists after refresh.");
  await expect(
    page.getByRole("button", { name: "Copy report", exact: true }),
  ).toBeDisabled();
});
test("download contains edited report; company details do not persist after reload", async ({
  page,
}) => {
  await page
    .getByLabel("Observed issue", { exact: true })
    .fill("SYNTHETIC-QP-SECRET: My saved profile name is lost.");
  await page
    .getByLabel("Expected result / acceptance criterion")
    .fill("The approved name should persist.");
  await page
    .getByLabel("Reproduction steps · one per line")
    .fill("Edit name\nSave\nRefresh");
  await page.getByRole("button", { name: "Prepare bug report" }).click();
  await page
    .getByLabel("Report text · editable before copying")
    .fill("Reviewed report: expected saved name, actual old name.");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download text" }).click();
  const stream = await (await pending).createReadStream();
  const text = Buffer.concat(await stream.toArray()).toString();
  expect(text).toBe("Reviewed report: expected saved name, actual old name.");
  expect(
    await page.evaluate(() =>
      JSON.stringify(localStorage).includes("SYNTHETIC-QP-SECRET"),
    ),
  ).toBe(false);
  await page.reload();
  await expect(page.getByLabel("Observed issue", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.locator("#bug-output")).toHaveValue("");
});
test("local screenshot preview, clear action, accessibility and responsive layout", async ({
  page,
}) => {
  await page
    .getByLabel("Optional screenshot · local preview only")
    .setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.locator("#bug-image-preview")).toBeVisible();
  await expect(page.locator("#bug-status")).toContainText(
    "not analyzed, uploaded",
  );
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Clear all bug details" }).click();
  await expect(page.locator("#bug-image-preview")).toBeHidden();
});

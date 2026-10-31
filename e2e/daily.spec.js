import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
const open = async (page, id) => {
  if (!(await page.locator(`#daily-${id}`).evaluate((n) => n.open)))
    await page.locator(`#daily-${id} summary`).click();
};
test.beforeEach(async ({ page }) => {
  await page.goto("/#daily");
});

test("Playwright retries stay visible and security walkthrough exports require evidence", async ({
  page,
}) => {
  await open(page, "reports");
  const report = {
    suites: [
      {
        title: "Synthetic fixture",
        file: "example.spec.js",
        specs: [
          {
            title: "Checkout retry",
            tests: [
              {
                projectName: "chromium",
                expectedStatus: "passed",
                results: [
                  {
                    status: "failed",
                    duration: 10,
                    errors: [{ message: "Synthetic first-attempt failure" }],
                  },
                  { status: "passed", duration: 15 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  await page.getByLabel("Current report", { exact: true }).setInputFiles({
    name: "results.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(report)),
  });
  await expect(page.locator("#daily-report-output")).toHaveValue(
    /FLAKY.*\n25 ms · 1 retries/,
  );
  await open(page, "security");
  await page
    .locator("#daily-security-0-result")
    .selectOption({ label: "Passed" });
  await page
    .locator("#daily-security")
    .getByRole("button", { name: "Download walkthrough", exact: true })
    .click();
  await expect(page.locator("#daily-security")).toContainText(
    "Completed checks require observations",
  );
  await page
    .locator("#daily-security-0-notes")
    .fill("Synthetic role A could not open role B's order.");
  await page
    .locator("#daily-security-0-evidence")
    .fill("Synthetic fixture record 01");
  const download = page.waitForEvent("download");
  await page
    .locator("#daily-security")
    .getByRole("button", { name: "Download walkthrough", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("security-walkthrough.csv");
});

test("story clarification, safe data export and exact regression mapping work", async ({
  page,
}) => {
  await page
    .getByLabel("Story or feature description")
    .fill("As a customer I want to checkout my cart");
  await page.getByRole("button", { name: "Review story", exact: true }).click();
  await expect(page.locator("#daily-story-output")).toHaveValue(
    /NEEDS CLARIFICATION/,
  );
  await open(page, "data");
  await page
    .getByRole("button", { name: "Generate test data", exact: true })
    .click();
  await expect(page.locator("#daily-data-output")).toHaveValue(
    /Numeric boundary 0/,
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download test data CSV", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("test-data.csv");
  await page.getByLabel("Inclusive maximum", { exact: true }).last().fill("6");
  await expect(
    page.getByRole("button", { name: "Download test data CSV", exact: true }),
  ).toBeDisabled();
  await open(page, "regression");
  await page
    .getByRole("button", { name: "Suggest regression set", exact: true })
    .click();
  await expect(page.locator("#daily-regression-output")).toHaveValue(
    /SUGGESTED · TC-01/,
  );
  await expect(page.locator("#daily-regression-output")).toHaveValue(
    /REVIEW UNMAPPED · TC-02/,
  );
});
test("exploratory finding hands supplied facts to the existing bug builder", async ({
  page,
}) => {
  await open(page, "explore");
  await page
    .getByLabel("Testing mission", { exact: true })
    .fill("Explore synthetic checkout retry");
  await page
    .getByRole("button", { name: "Start session", exact: true })
    .click();
  await page
    .getByLabel("Observation", { exact: true })
    .fill("Synthetic example: order confirmation missing");
  await page.locator("#daily-explore-evidence").fill("local capture 01");
  await page
    .getByRole("button", { name: "Record observation", exact: true })
    .click();
  await expect(page.getByLabel("Recorded finding")).toContainText(
    "order confirmation missing",
  );
  await page.getByRole("button", { name: "End session", exact: true }).click();
  await page
    .getByRole("button", { name: "Draft bug from finding", exact: true })
    .click();
  await expect(page).toHaveURL(/#bugs$/);
  await expect(page.locator('#bug-form [name="actual"]')).toHaveValue(
    /order confirmation missing/,
  );
});
test("screenshot markers export actual annotated pixels and reject unsupported files", async ({
  page,
}) => {
  await open(page, "visual");
  const png = await page.screenshot();
  await page.getByLabel("Expected screenshot", { exact: true }).setInputFiles({
    name: "expected.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByRole("button", { name: "Mark centre of expected", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Expected marker note", { exact: true })
    .fill("Compare primary button spacing");
  await page
    .getByRole("button", { name: "Mark centre of expected", exact: true })
    .click();
  await expect(page.locator("#daily-visual ol").first()).toContainText(
    "Compare primary button spacing",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download expected annotated image",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toBe("expected-annotated.png");
  await page.getByLabel("Expected screenshot", { exact: true }).setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByRole("button", {
      name: "Download expected annotated image",
      exact: true,
    }),
  ).toBeDisabled();
});
test("JUnit comparison retains failures, handles previous runs and drafts a bug", async ({
  page,
}) => {
  await open(page, "reports");
  const report = (name, body) => ({
    name,
    mimeType: "application/xml",
    buffer: Buffer.from(body),
  });
  await page
    .getByLabel("Previous report (optional)", { exact: true })
    .setInputFiles(
      report(
        "previous.xml",
        '<testsuite name="demo"><testcase name="Checkout" time="0.1"/></testsuite>',
      ),
    );
  await page
    .getByLabel("Current report", { exact: true })
    .setInputFiles(
      report(
        "current.xml",
        '<testsuite name="demo"><testcase name="Checkout" time="0.2"><failure message="missing">Order missing</failure></testcase></testsuite>',
      ),
    );
  await expect(page.locator("#daily-report-output")).toHaveValue(
    /passed → failed/,
  );
  await page
    .getByRole("button", {
      name: "Draft bug from imported result",
      exact: true,
    })
    .click();
  await expect(page.locator('#bug-form [name="actual"]')).toHaveValue(
    "Order missing",
  );
  await page.goto("/#daily");
  await open(page, "reports");
  await page
    .getByLabel("Current report", { exact: true })
    .setInputFiles(report("bad.xml", "<!DOCTYPE testsuite><testsuite/>"));
  await expect(
    page.getByRole("button", { name: "Download comparison CSV", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#daily-reports")).toContainText("DTD and entity");
});
test("guided checks require evidence and the expanded workbench is accessible and responsive", async ({
  page,
}) => {
  await open(page, "accessibility");
  await page
    .locator("#daily-accessibility-0-result")
    .selectOption({ label: "Failed" });
  await page.locator("#daily-accessibility-0").getByRole("button").click();
  await expect(page.locator("#daily-accessibility")).toContainText(
    "Record a Failed outcome",
  );
  for (const section of await page.locator(".daily-tool").all())
    if (!(await section.evaluate((n) => n.open)))
      await section.locator("summary").click();
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

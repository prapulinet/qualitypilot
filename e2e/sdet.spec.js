import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/#launch");
});
const open = async (page, id) => {
  if (!(await page.locator(`#${id}`).evaluate((n) => n.open)))
    await page.locator(`#${id} > summary`).click();
};
test("guided campaign handoff preserves projects and refuses duplicate imports or automatic reviews", async ({
  page,
}) => {
  await page.getByRole("link", { name: "QA workspace", exact: true }).click();
  await page
    .getByLabel("New project name", { exact: true })
    .fill("Existing project");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page.getByRole("link", { name: "QA Launchpad", exact: true }).click();
  await page
    .getByLabel("Campaign feature name", { exact: true })
    .fill("Synthetic checkout campaign");
  await page
    .getByLabel("Feature profile", { exact: true })
    .selectOption("checkout");
  await page
    .getByLabel("Confirmed criteria · one per line, maximum 8", { exact: true })
    .fill("The demo cart becomes empty after a successful checkout.");
  await page
    .getByRole("button", { name: "Build campaign", exact: true })
    .click();
  await expect(page.locator("#launch-campaign")).toContainText(
    "4 design prompts · 0 reviewed · 0 executed",
  );
  await page
    .getByRole("button", { name: "Add campaign to QA workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/#workspace$/);
  await expect(page.locator("#workspace-select option")).toHaveCount(2);
  await expect(page.getByLabel("Expected TC-1", { exact: true })).toHaveValue(
    /\[NEEDS CONFIRMATION\]/,
  );
  await page.getByRole("button", { name: "Review TC-1", exact: true }).click();
  await expect(page.locator("#workspace-status")).toContainText("placeholder");
  await page.getByRole("link", { name: "QA Launchpad", exact: true }).click();
  await page
    .getByRole("button", { name: "Add campaign to QA workspace", exact: true })
    .click();
  await expect(page.locator("#launch-campaign")).toContainText(
    "already exists",
  );
  await expect(page.locator("#workspace-select option")).toHaveCount(2);
});
test("decision table blocks missing outcomes and imports only reviewed-for-applicability rows", async ({
  page,
}) => {
  await open(page, "launch-decisions");
  await page
    .getByLabel("Decision feature name", { exact: true })
    .fill("Synthetic permissions");
  await page
    .getByLabel("Decision acceptance criterion", { exact: true })
    .fill("Agreed synthetic access decision rule.");
  await page
    .getByLabel("Binary conditions · one per line, maximum 5", { exact: true })
    .fill("Signed in");
  await page
    .getByRole("button", { name: "Generate combinations", exact: true })
    .click();
  await expect(page.locator(".decision-matrix article")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "Add decision tests to QA workspace",
      exact: true,
    })
    .click();
  await expect(page.locator("#launch-decisions")).toContainText(
    "Expected behavior for R-1",
  );
  await page.locator("#decision-R-1-disposition").selectOption("exclude");
  await page
    .locator("#decision-R-1-reason")
    .fill("Synthetic test environment only supplies signed-in identities.");
  await page
    .locator("#decision-R-2-expected")
    .fill("Confirmed synthetic outcome: permitted view is displayed.");
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download decision table CSV", exact: true })
    .click();
  expect((await dl).suggestedFilename()).toBe("decision-table.csv");
  await page
    .getByRole("button", {
      name: "Add decision tests to QA workspace",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/#workspace$/);
  await expect(page.locator("#workspace-case-count")).toHaveText("1");
});
test("real local API capture passes reusable checks and edited expectations create a bug draft", async ({
  page,
}) => {
  await open(page, "launch-contract");
  const r = page.waitForResponse((response) =>
    response.url().endsWith("/api/health"),
  );
  await page
    .getByRole("button", { name: "Capture local health response", exact: true })
    .click();
  await r;
  await expect(page.locator("#contract-response")).toHaveValue(/aiConfigured/);
  await page
    .getByRole("button", { name: "Check contract", exact: true })
    .click();
  await expect(page.locator("#launch-contract")).toContainText(
    "4/4 assertions passed",
  );
  await open(page, "contract-rule-builder");
  await page
    .getByLabel("New assertion name", { exact: true })
    .fill("Builder checks health");
  await page.locator("#contract-rule-value").fill("ok");
  await page
    .getByRole("button", { name: "Add assertion", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download contract JUnit", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Check contract", exact: true })
    .click();
  await expect(page.locator("#launch-contract")).toContainText(
    "5/5 assertions passed",
  );
  const suite = JSON.parse(await page.locator("#contract-suite").inputValue());
  suite.rules[0].expected = 500;
  await page.locator("#contract-suite").fill(JSON.stringify(suite));
  await expect(
    page.getByRole("button", { name: "Download contract JUnit", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Check contract", exact: true })
    .click();
  await expect(page.locator("#contract-results")).toContainText(
    "FAIL · HTTP success",
  );
  await page
    .getByRole("button", {
      name: "Draft bug from contract failures",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/#bugs$/);
  await expect(page.locator('#bug-form [name="expected"]')).toHaveValue(/500/);
});
test("contract JUnit imports into automation inbox and malformed suites never leave passing evidence", async ({
  page,
}) => {
  await open(page, "launch-contract");
  await page.locator("#contract-response").fill(
    JSON.stringify({
      status: 200,
      durationMs: 1,
      headers: { "content-type": "application/json" },
      body: { status: "synthetic incorrect", aiConfigured: false },
    }),
  );
  await page
    .getByRole("button", { name: "Check contract", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download contract JUnit", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  await page
    .getByRole("link", { name: "Daily workbench", exact: true })
    .click();
  await open(page, "daily-reports");
  await page.getByLabel("Current report", { exact: true }).setInputFiles({
    name: "contract.xml",
    mimeType: "application/xml",
    buffer: Buffer.concat(chunks),
  });
  await expect(page.locator("#daily-report-output")).toHaveValue(
    /FAILED · Health status/,
  );
  await page.getByRole("link", { name: "QA Launchpad", exact: true }).click();
  await page
    .locator("#contract-suite")
    .fill('{"version":1,"name":"empty","rules":[]}');
  await page
    .getByRole("button", { name: "Check contract", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download contract JUnit", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#contract-results article")).toHaveCount(0);
});
test("guided links open the right tool and expanded Launchpad is accessible and fits viewport", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Clarify story", exact: true })
    .click();
  await expect(page).toHaveURL(/#daily$/);
  await expect(page.locator("#daily-story")).toHaveAttribute("open", "");
  await page.getByRole("link", { name: "QA Launchpad", exact: true }).click();
  await open(page, "launch-decisions");
  await open(page, "launch-contract");
  await open(page, "contract-rule-builder");
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

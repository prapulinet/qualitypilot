import { test, expect } from "./fixtures.js";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/#workspace");
});
async function setup(page) {
  await page
    .getByLabel("New project name", { exact: true })
    .fill("Account release");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByLabel("New acceptance criterion", { exact: true })
    .fill("Saved names remain after refreshing the page.");
  await page
    .getByRole("button", { name: "Add criterion", exact: true })
    .click();
  await page.getByLabel("New test title", { exact: true }).fill("Persist name");
  await page
    .getByLabel("New test steps", { exact: true })
    .fill("Edit name, save, refresh");
  await page
    .getByLabel("New expected result", { exact: true })
    .fill("New name remains");
  await page
    .getByRole("button", { name: "Add test case", exact: true })
    .click();
  await page.getByRole("button", { name: "Review TC-1", exact: true }).click();
}
async function session(page, name, status) {
  await page.getByLabel("Execution session name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Start execution session", exact: true })
    .click();
  await page
    .getByLabel("Result for run case 1", { exact: true })
    .selectOption(status);
  await page
    .getByLabel("Observed result for run case 1", { exact: true })
    .fill(status === "failed" ? "Old name returned" : "New name remained");
  await page
    .getByLabel("Evidence for run case 1", { exact: true })
    .fill(`${name}-trace`);
  await page
    .getByRole("button", { name: "Record run case 1", exact: true })
    .click();
}
test("failed evidence links to a defect, Jira draft and newer passing retest", async ({
  page,
}) => {
  await setup(page);
  await session(page, "Initial", "failed");
  await page
    .getByLabel("Defect severity for run case 1", { exact: true })
    .selectOption("Major");
  await page
    .getByRole("button", { name: "Link defect for run case 1", exact: true })
    .click();
  await expect(page.locator("#workspace-defect-count")).toHaveText("1");
  await page
    .getByRole("button", {
      name: "Draft Jira report for run case 1",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Actual result · defaults to observed issue"),
  ).toHaveValue("Old name returned");
  await expect(
    page.getByLabel("Expected result / acceptance criterion"),
  ).toHaveValue("New name remains");
  await page.getByRole("link", { name: "QA workspace", exact: true }).click();
  await session(page, "Retest", "passed");
  await page
    .getByRole("button", {
      name: "Close after retest: Persist name",
      exact: true,
    })
    .click();
  await expect(page.locator("#workspace-decision")).toHaveText(
    "Ready for human release review",
  );
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download release review", exact: true })
    .click();
  const stream = await (await pending).createReadStream();
  expect(Buffer.concat(await stream.toArray()).toString()).toContain(
    "Human sign-off is required",
  );
  await page
    .getByRole("button", { name: "Reopen defect: Persist name", exact: true })
    .click();
  await expect(page.locator("#workspace-decision")).toHaveText(
    "Not ready for release review",
  );
});
test("changed requirement blocks stale execution and preserves the old snapshot", async ({
  page,
}) => {
  await setup(page);
  await session(page, "Before change", "passed");
  await page
    .getByLabel("Acceptance criterion AC-1", { exact: true })
    .fill("Saved names remain after logout and sign-in too.");
  await page.getByRole("button", { name: "Update AC-1", exact: true }).click();
  await expect(page.locator("#workspace-blockers")).toContainText(
    "Design review required",
  );
  await expect(page.locator("#workspace-execution")).toContainText(
    "Expected: New name remains",
  );
  await page
    .getByLabel("Execution session name", { exact: true })
    .fill("Premature session");
  await page
    .getByRole("button", { name: "Start execution session", exact: true })
    .click();
  await expect(page.locator("#workspace-status")).toContainText(
    "Review all current",
  );
});
test("explicit local save and validated backup restore preserve a project", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await page.reload();
  await expect(page.locator("#workspace-name")).toHaveText("Account release");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export workspace backup", exact: true })
    .click();
  const stream = await (await pending).createReadStream();
  const data = Buffer.concat(await stream.toArray());
  await page.getByText("Restore a workspace backup", { exact: true }).click();
  await page.getByLabel("Workspace JSON backup · max 2 MB").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99,"projects":[]}'),
  });
  await page
    .getByRole("checkbox", {
      name: "I understand restoring replaces the current in-memory project collection.",
    })
    .check();
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await expect(page.locator("#workspace-status")).toContainText("Unsupported");
  await expect(page.locator("#workspace-name")).toHaveText("Account release");
  await page.getByLabel("Workspace JSON backup · max 2 MB").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: data,
  });
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await expect(page.locator("#workspace-status")).toContainText(
    "not independently verified",
  );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Delete selected project", exact: true })
    .click();
  await expect(page.locator("#workspace-name")).toHaveText("Account release");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete selected project", exact: true })
    .click();
  await expect(page.locator("#workspace-empty")).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("qp-workspaces-v1").includes("Account release"),
    ),
  ).toBe(true);
});
test("coverage import creates unreviewed designs and does not copy manual pass claims", async ({
  page,
}) => {
  await page.goto("/#coverage");
  await page
    .getByRole("button", { name: "Build coverage plan", exact: true })
    .click();
  await page.getByRole("link", { name: "QA workspace", exact: true }).click();
  await page
    .getByLabel("New project name", { exact: true })
    .fill("Imported planning");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import coverage draft", exact: true })
    .click();
  await expect(page.locator("#workspace-case-count")).toHaveText("6");
  await expect(page.locator("#workspace-pass-count")).toHaveText("0");
  await page.getByRole("button", { name: "Review TC-1", exact: true }).click();
  await expect(page.locator("#workspace-status")).toContainText(
    "clarification placeholder",
  );
});
test("boundary helper and populated workspace are accessible and responsive", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByText("Numeric boundary test data assistant", { exact: true })
    .click();
  await page.getByLabel("Inclusive minimum", { exact: true }).fill("8");
  await page.getByLabel("Inclusive maximum", { exact: true }).fill("20");
  await page
    .getByRole("button", { name: "Generate boundaries", exact: true })
    .click();
  await expect(page.locator("#workspace-boundaries")).toContainText(
    "21: Outside inclusive range",
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
});

# Contributing

Use Node.js 22 or newer. Clone the repository, run `npm ci`, then `npx playwright install chromium`.

1. Create a branch: `git switch -c codex/describe-the-change`.
2. Make a focused change and explain its expected behavior.
3. Run `npm run format`, `npm run test:all`, and `npm run format:check`.
4. Inspect `git diff` and commit source plus lockfile changes. Generated test reports stay untracked.
5. Open a pull request with behavior and validation evidence.

## Test isolation

Browser tests use a fresh Node server on an ephemeral localhost port for every test. API tests own their server too. Real AI gateways are disabled in the test fixtures. Tests must not rely on order, shared cart contents or external services.

## Debugging

`npm run test:e2e -- --project=chromium --headed` opens the browser. `npm run report` opens the HTML report. A failed browser test retains a screenshot, video and trace. Open a trace with `npx playwright show-trace path/to/trace.zip`.

The workbench's diagnostic suite intentionally fails one catalog expectation. That is a demonstration of triage; the automated test verifies that this failure is labeled correctly, so the overall CI suite should still pass.

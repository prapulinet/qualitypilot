# Local portfolio handover

For later releases, read the [1.2 Daily Workbench supplement](daily-workbench.md), [1.3 QA Launchpad and contract checks](sdet-workflow.md) and [current verification](verification.md). The snapshot below records the earlier 1.1 handover, not current test totals.

Verified application revision: `35e08b23518d114da7c320538f3a7c090214a277`.

Final local regression: 40 native tests and 54 desktop/mobile Chromium checks passed. Syntax and formatting checks passed. Published CI for the application revision succeeded: https://github.com/prapulinet/qualitypilot/actions/runs/41198223155.

No additional functional change was required by this handover audit. The release is ready to demonstrate within its documented local portfolio scope. Future requirements, dependency changes or a hosted multi-user edition require maintenance and new verification.

## Interview material

- [Project understanding and interview guide](interview-learning-guide.md)
- [Word learning guide](QualityPilot_Interview_and_Learning_Guide.docx)
- [Connected workflow architecture](connected-workspace.md)
- [Test strategy](test-strategy.md)

## Demonstration sequence

Show the README and verified CI, execute the real commerce API regression, then demonstrate criterion/design versions, manual observations, defects, retests and release blockers in QA workspace. Mark simulated examples as synthetic. Manual pass records are separate from automated CI checks.

## Current boundaries

This is a local portfolio application with explicit browser persistence and bounded history. Production accounts, shared durable storage, real payments, live model evaluation, additional browser engines, load testing and manual screen-reader validation are outside its verified scope. Human release sign-off remains required.

Documentation-only handover commits may follow the application revision. Let the normal CI workflow verify those published commits too.

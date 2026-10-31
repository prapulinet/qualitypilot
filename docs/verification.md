# Verification evidence

Validated locally on Node.js v24.19.0, Windows:

- Native tests: **40 passed, 0 failed**.
- Playwright: **54 passed, 0 failed** — desktop Chromium and Pixel 7 mobile emulation.
- Browser tests own isolated application servers; no live AI keys or external demo sites are used.
- Accessibility scans cover all seven views, plus generated draft and completed regression states, in both browser projects.
- Actual desktop/mobile previews are under `docs/images`.
- An actual fixed-suite regression response is under `docs/evidence/regression-run.json`.
- Failure screenshots, videos and traces were generated during failed pre-fix checks; the final passing run does not manufacture failure artifacts.

Repository: https://github.com/prapulinet/qualitypilot

The original starter CI passed at https://github.com/prapulinet/qualitypilot/actions/runs/41185618370. That run validates the earlier starter commit, not this expanded milestone. Check Actions after publishing the new commits for current remote evidence.

## User acceptance check · 31 October 2026

The user reported that the instructed manual flows worked: commerce regression in the test lab, scenario generation/review/export, and demo sign-in/cart/checkout. This records user-reported acceptance; it is separate from automated test evidence.

## Published milestone status

Application commit `35e08b23518d114da7c320538f3a7c090214a277` passed GitHub CI: https://github.com/prapulinet/qualitypilot/actions/runs/41198223155. Native Node 22/24 jobs and the Linux browser job succeeded. The final local handover regression also passed 40 native tests, 54 browser checks, syntax checks and formatting. Documentation-only handover changes may follow this application revision and should receive their normal CI run after publishing.

The connected-workspace screenshot and `workspace-example.json` backup use explicitly synthetic demonstration states. They are separate from real automated test results. Native checks cover revision invalidation, closure/reopening, snapshot retention, malformed backups, the backup byte budget and Jira-draft field bounds; browser checks exercise the connected human workflow on desktop/mobile.

Historical diagnosis: run https://github.com/prapulinet/qualitypilot/actions/runs/41189802695 passed native checks but failed one mobile browser case. See `bugs/QP-003.md` for the subsequent fix, verified by the successful baseline run above.

Live provider integration, additional browser engines, load tests and manual assistive-technology testing remain unverified.

# Verification evidence

Validated locally on Node.js v24.19.0, Windows:

- Native tests: **30 passed, 0 failed**.
- Playwright: **44 passed, 0 failed** — desktop Chromium and Pixel 7 mobile emulation.
- Browser tests own isolated application servers; no live AI keys or external demo sites are used.
- Accessibility scans cover all six views, plus generated draft and completed regression states, in both browser projects.
- Actual desktop/mobile previews are under `docs/images`.
- An actual fixed-suite regression response is under `docs/evidence/regression-run.json`.
- Failure screenshots, videos and traces were generated during failed pre-fix checks; the final passing run does not manufacture failure artifacts.

Repository: https://github.com/prapulinet/qualitypilot

The original starter CI passed at https://github.com/prapulinet/qualitypilot/actions/runs/41185618370. That run validates the earlier starter commit, not this expanded milestone. Check Actions after publishing the new commits for current remote evidence.

## User acceptance check · 31 October 2026

The user reported that the instructed manual flows worked: commerce regression in the test lab, scenario generation/review/export, and demo sign-in/cart/checkout. This records user-reported acceptance; it is separate from automated test evidence.

## Published milestone status

The pre-planner baseline at commit `591178f0e34d68603cb099bb5cd81f5b91dd5d55` passed GitHub CI: https://github.com/prapulinet/qualitypilot/actions/runs/41191645458. This verifies the mobile history fix and the previous 28-browser-check suite. Coverage-planner and bug-builder updates need their own remote CI run after publication.

Historical diagnosis: run https://github.com/prapulinet/qualitypilot/actions/runs/41189802695 passed native checks but failed one mobile browser case. See `bugs/QP-003.md` for the subsequent fix, verified by the successful baseline run above.

Live provider integration, additional browser engines, load tests and manual assistive-technology testing remain unverified.

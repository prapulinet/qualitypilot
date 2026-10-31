# Verification evidence

Validated locally on Node.js v24.19.0, Windows:

- Native tests: **19 passed, 0 failed**.
- Playwright: **28 passed, 0 failed** — desktop Chromium and Pixel 7 mobile emulation.
- Browser tests own isolated application servers; no live AI keys or external demo sites are used.
- Accessibility scans cover all four views, plus generated draft and completed regression states, in both browser projects.
- Actual desktop/mobile previews are under `docs/images`.
- An actual fixed-suite regression response is under `docs/evidence/regression-run.json`.
- Failure screenshots, videos and traces were generated during failed pre-fix checks; the final passing run does not manufacture failure artifacts.

Repository: https://github.com/prapulinet/qualitypilot

The original starter CI passed at https://github.com/prapulinet/qualitypilot/actions/runs/41185618370. That run validates the earlier starter commit, not this expanded milestone. Check Actions after publishing the new commits for current remote evidence.

## User acceptance check · 31 October 2026

The user reported that the instructed manual flows worked: commerce regression in the test lab, scenario generation/review/export, and demo sign-in/cart/checkout. This records user-reported acceptance; it is separate from automated test evidence.

## Published milestone status

Confirmed public project head: `5ac38d8be1e79b3f65d6dbed2c9239aacc7fa743`. Confirmed profile head: `b07b4da783bf0334fc02b085c4ca5947b7be22d5`.

At https://github.com/prapulinet/qualitypilot/actions/runs/41189802695, native checks on Node 22 and 24 passed, while the browser test step failed (27 passed, 1 failed). Dependency installation, formatting and browser installation passed. The report and screenshot identified saved-history overflow on mobile; see `bugs/QP-003.md` for the layout fix and strengthened regression test. A new green remote run is still required after publishing the fix.

Live provider integration, additional browser engines, load tests and manual assistive-technology testing remain unverified.

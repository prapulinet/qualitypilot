# Verification evidence

Validated locally on Node.js v24.19.0, Windows:

- Native tests: **52 passed, 0 failed**.
- Playwright: **80 passed, 0 failed** — desktop Chromium and Pixel 7 mobile emulation.
- Browser tests own isolated application servers; no live AI keys or external demo sites are used.
- Accessibility scans cover all nine views, including Daily Workbench and expanded QA Launchpad/assertion builder, plus generated draft and completed regression states, in both browser projects.
- Actual desktop/mobile previews are under `docs/images`.
- An actual fixed-suite regression response is under `docs/evidence/regression-run.json`.
- Failure screenshots, videos and traces were generated during failed pre-fix checks; the final passing run does not manufacture failure artifacts.

Repository: https://github.com/prapulinet/qualitypilot

The original starter CI passed at https://github.com/prapulinet/qualitypilot/actions/runs/41185618370. That run validates the earlier starter commit, not this expanded milestone. Check Actions after publishing the new commits for current remote evidence.

## User acceptance check · 31 October 2026

The user reported that the instructed manual flows worked: commerce regression in the test lab, scenario generation/review/export, and demo sign-in/cart/checkout. This records user-reported acceptance; it is separate from automated test evidence.

## Published milestone status

Version 1.4 adds manual compatibility tracking, build/context separation, evidence guards, failed-result handoff, CSV/JSON exports, validated restoration and a 256 KB UTF-8 rollback budget. Two native tests and two browser behaviors per project cover these additions. The learning guide and Word version now cover release 1.4. The previous published 1.3 revision `025c95a` passed GitHub Actions run https://github.com/prapulinet/qualitypilot/actions/runs/41244540826. Verify the corresponding 1.4 commit's run after publishing; that earlier run does not validate the new matrix.

Version 1.3 adds six native tests and five browser behaviors per project: campaign handoff without replacing projects, duplicate/placeholder guards, decision-table outcomes/exclusions, actual local health capture, assertion form and invalidation, failed assertion handoff, JUnit round-trip into Automation Inbox, guided navigation and expanded-view accessibility/layout. Native checks cover pointer resolution, contract types/validation, decision generation, campaign approval guards and actual CLI exit codes/JUnit. See the published 1.3 commit's Actions run for remote verification; prior runs below cover only their named revisions. The synthetic health response fixture is training data, separate from actual local capture.

The 1.2 Daily Workbench adds six browser behaviors in both projects and four native tests. Checks cover story clarification, boundary data/CSV exports, exact regression tags, exploratory findings, screenshot annotations, JUnit comparisons, Playwright retries, walkthrough evidence guards and expanded-view accessibility/layout. The Word guide remains a record of the verified 1.1 baseline; [Daily Workbench](daily-workbench.md) is its 1.2 learning supplement. See GitHub Actions for the corresponding published 1.2 commit run; earlier runs below verify only their named revisions.

Application commit `35e08b23518d114da7c320538f3a7c090214a277` passed GitHub CI: https://github.com/prapulinet/qualitypilot/actions/runs/41198223155. Native Node 22/24 jobs and the Linux browser job succeeded. The final local handover regression also passed 40 native tests, 54 browser checks, syntax checks and formatting. Documentation-only handover changes may follow this application revision and should receive their normal CI run after publishing.

The connected-workspace screenshot and `workspace-example.json` backup use explicitly synthetic demonstration states. They are separate from real automated test results. Native checks cover revision invalidation, closure/reopening, snapshot retention, malformed backups, the backup byte budget and Jira-draft field bounds; browser checks exercise the connected human workflow on desktop/mobile.

Historical diagnosis: run https://github.com/prapulinet/qualitypilot/actions/runs/41189802695 passed native checks but failed one mobile browser case. See `bugs/QP-003.md` for the subsequent fix, verified by the successful baseline run above.

Live provider integration, additional browser engines, load tests and manual assistive-technology testing remain unverified.

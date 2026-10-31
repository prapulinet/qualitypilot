# QualityPilot Project Understanding and Interview Guide

Prepared for Prapul | Local portfolio release 1.1 | 31 October 2026

QualityPilot is a JavaScript QA portfolio application that connects test design, manual execution evidence, defects and release review. This guide explains what it does, why the design matters, and how to demonstrate it honestly in an interview.

The main lesson is simple: a passing result is useful only when the requirement, test design and evidence are still relevant. The project demonstrates that relationship alongside genuine automated API and browser tests.

### Verified project snapshot

| Item             | Verified position                                                  |
| ---------------- | ------------------------------------------------------------------ |
| Source revision  | 35e08b2                                                            | Connected local QA workflow |
| Automated checks | 40 native tests and 54 desktop and mobile Chromium checks          |
| Remote CI        | Successful run 41198223155 for revision 35e08b2                    |
| Runtime          | JavaScript ESM and Node.js 22.9 or newer; no runtime dependencies  |
| Operating scope  | Local portfolio application; manual evidence remains user reported |

### How to use this guide

Read the purpose and module map before memorizing any interview answer.

Practise the junior and mid-level workflows in the app using synthetic data.

Study the architecture and lifecycle rules, then rehearse the demonstration.

Use the questions to test your understanding. Explain unfamiliar code only after reading and running it.

Repository: https://github.com/prapulinet/qualitypilot

Verified CI: https://github.com/prapulinet/qualitypilot/actions/runs/41198223155

Roman Telugu memory cue: Project features list matrame kaadu; requirement nunchi evidence, defect, release decision varaku sambandham explain cheyyali.

## Explain the project in an interview

### A natural sixty second introduction

I use QualityPilot to demonstrate a complete QA workflow in JavaScript. A tester can capture acceptance criteria, create and review test designs, record manual observations with evidence, and connect failures to defects and retests. The application also has a real API test lab and Playwright browser automation.

Its main design feature is version awareness. When a requirement or test design changes, older evidence cannot automatically establish readiness for the new version. The release report explains missing reviews, stale evidence and important open defects. A human still makes the release decision.

The current local application needs no AI key or Jira access. It has 40 native checks and 54 desktop and mobile browser checks, with GitHub Actions evidence. It is a portfolio demonstration, so I distinguish its tested features from production capabilities that are outside its scope.

### Expand the explanation when asked

The starting problem is fragmented QA work: requirements in one place, test notes somewhere else, and bug reports without clear expected behavior or evidence. QualityPilot brings those links into one local workflow. I can demonstrate a reviewed design, an observed failure, a linked defect and a newer passing retest.

The manual workflow and the automated checks are separate. Recording a manual pass does not increase the CI test count. The API lab executes fixed HTTP assertions against its demo commerce service; Playwright tests the application through the browser. The local workspace records human observations and artifact references.

I chose a small runtime and separated domain rules from UI rendering. That makes lifecycle rules testable without launching a browser. Browser tests then verify that the complete user journeys, forms, exports and error handling work together.

### How to present your contribution

Describe the work you can demonstrate: decisions you understand, code paths you have read, defects you investigated, and checks you ran. If asked about development assistance, describe the tools you used accurately. Do not claim years of experience, production users or independent authorship that you cannot substantiate.

Roman Telugu memory cue: Short answer lo problem, workflow, important decision, test evidence cheppandi. Senior laga sound avvadam kanna decisions enduku teesukunnamo ardham chesukovadam mukhyam.

## Understand the seven application areas

Each area has a distinct purpose. Start with QA workspace for a connected project, then use the supporting tools when they help a specific testing task.

| Area               | Practical purpose                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| QA workspace       | Projects, acceptance criteria, reviewed designs, session snapshots, observed results, defects, retests and release review.              |
| Bug report builder | Turn an observation and known facts into an editable Jira-ready text draft. Unknown details remain questions.                           |
| Coverage planner   | Link criteria to deterministic positive, negative and boundary prompts; score risk and track manual review or evidence.                 |
| Scenario studio    | Generate generic baseline prompts, review them, keep the last eight drafts and export JSON. Optional AI gateway requires configuration. |
| Test lab           | Execute real local HTTP smoke, regression and diagnostic suites; inspect assertion evidence and download results.                       |
| Demo commerce      | A synthetic store with sign-in, products, isolated cart, integer totals, checkout retry safety and order ownership.                     |
| Project guide      | An in-app explanation of the earlier workbench and its boundaries. Use repository docs for the connected workspace walkthrough.         |

### Know where data lives

Workspace changes begin in memory. Save locally explicitly writes its projects, evidence references and defects to browser storage. Export JSON for a separate backup. Coverage and scenario drafts have their own browser storage. The bug builder keeps details only in the current tab unless you intentionally copy or download them.

The HTTP test lab retains up to 20 runs in server memory. Restarting the server resets that history. Demo sessions are synthetic and expire. These are different storage lifecycles; do not describe them as a durable team database.

Roman Telugu memory cue: QA workspace main flow. Test lab actual HTTP checks. Bug builder copy-paste help. Ee moodinti results ni okate coverage number ga cheppakandi.

## Use the project as a junior QA

A junior tester benefits most from a repeatable way to understand a requirement, write a reproducible case and record what actually happened. The application guides those activities; it does not replace product knowledge.

### Start from an acceptance criterion

Use a criterion that can be checked. In the actual demo store, an example is: after a valid demo checkout, the cart becomes empty and a demo order is confirmed. Write prerequisites, the actions to perform, and the expected visible result. Execute the store flow before recording a result.

Positive: sign in, add a known product, complete demo checkout and verify confirmation plus an empty cart.

Negative: try an invalid session or invalid product through the API tests; verify the documented rejection.

Boundary: the cart API accepts integer quantities from 1 to 5. Check 0, 1, 5 and 6; also check a fractional quantity.

End to end: sign in, browse, add, verify the total, checkout, confirm the order and sign out.

### Separate facts from questions

An expected result must come from the approved rule. If the requirement does not define a length limit, timeout or error message, ask for clarification. The bug builder marks missing expected behavior rather than making it up. Coverage prompts require tailoring before use.

### Practise boundary design

For a hypothetical inclusive range of 8 to 20, the boundary assistant proposes 7, 8, 9, 19, 20 and 21. This is a design exercise. It does not mean the demo store implements that particular range. Always connect the generated values to a real requirement.

| Habit                | Evidence you can show                                        |
| -------------------- | ------------------------------------------------------------ |
| Clear test design    | Criterion, prerequisites, steps and expected result          |
| Accurate observation | Actual result plus a sanitized evidence reference            |
| Reproducible defect  | Summary, environment, steps, expected versus actual behavior |

Roman Telugu memory cue: Expected result ante requirement prakaram jaragalsindi. Actual result ante meeru nijanga observe chesindi. Rendu separate ga rayandi.

## Use the project as a mid level QA

At mid level, the emphasis moves from individual cases to reliable execution, regression impact, defect quality and coordination. QualityPilot makes these links visible.

### Manage an execution session

Review current designs before creating a session. The session copies the relevant steps, expected result, case version and criterion revision. Record Passed, Failed or Blocked explicitly, together with observed behavior and an evidence reference. A reference is not an uploaded or independently authenticated artifact.

### Connect a failure to a useful defect

A defect can be linked only from a failed session result. Select severity based on observed impact. The Jira draft receives the known steps and expected and actual results; confirm missing environment, reproducibility and business details before submitting it manually.

After a fix, create a newer session and retest the current reviewed design. Closure requires passing evidence for that case. If you discover that the closure evidence is wrong, reopen the defect before correcting that protected retest result.

### Handle change without losing history

A criterion update increments its revision. A design edit increments the case version and resets its review. Existing session definitions remain historical snapshots. A previous pass can remain a true record of the earlier design while being insufficient for the changed release.

### Useful interview example

Suppose checkout originally required an empty cart after confirmation, then the criterion changes to also require a visible order reference. The older case and evidence may not check that reference. Re-review and update the design, then execute a new session. Do not silently reuse the old pass.

Roman Telugu memory cue: Old test pass ayindani new requirement kuda cover ayindani anukokudadhu. Requirement revision, case version, latest execution match avvali.

## Use the project as a senior QA

Senior-level discussion should focus on risk, trustworthy evidence, tradeoffs and release communication. The application supports that reasoning, while leaving business approval with the responsible people.

### Prioritize risk and explain the heuristic

Impact and likelihood are scored from 1 to 5. Multiplying them gives a score up to 25. The planner labels 15 to 25 High, 8 to 14 Medium and 1 to 7 Low. These are project heuristics; they are not a universal industry standard or a measured failure probability.

### Explain release blockers

| Condition                                     | Application response                         |
| --------------------------------------------- | -------------------------------------------- |
| Criterion has no design                       | Blocks readiness for release review          |
| Design is unreviewed or evidence is stale     | Blocks readiness for release review          |
| Latest evidence is missing, failed or blocked | Blocks readiness for release review          |
| Open Blocker Critical or Major defect         | Blocks readiness for release review          |
| Open Minor or Cosmetic defect                 | Appears as a warning for human consideration |

Ready for human release review means the configured checks found no blockers inside this plan. It does not establish complete coverage, approve release, authenticate evidence or guarantee a bug-free product. A senior QA explains residual risk instead of hiding it behind a percentage.

### Discuss the production boundary

Local operation avoids requiring external account access. The tradeoff is browser storage, limited history and no team identity system. A hosted edition would need authorization, durable storage, concurrency controls, authenticated audit history, retention policy and monitoring. Those are future design needs, not completed features.

Roman Telugu memory cue: Senior explanation lo count of test cases kanna risk, evidence freshness, open defects, remaining uncertainty enduku important oo cheppandi.

## Explain the architecture

The runtime is deliberately small. JavaScript ESM is used in the browser and Node server. Playwright, axe and Prettier are development tools; the application declares no runtime package dependencies.

### Two execution paths

Manual path: browser UI to pure domain rules to in-memory projects, with explicit local save or JSON export. Automated API path: browser test lab to Node HTTP API to fixed local suites and demo commerce. Playwright independently drives the browser against fresh app servers.

| Code location                 | Responsibility                                                           |
| ----------------------------- | ------------------------------------------------------------------------ |
| web/workspace-model.js        | Revisions, lifecycle guards, snapshots, backup schema and release policy |
| web/workspace.js              | Forms, selection, local persistence, import and UI rollback              |
| web/coverage-model.js         | Risk summaries and safe CSV export                                       |
| web/bug-model.js              | Deterministic bug drafts and explicit unknown details                    |
| src/server.js                 | HTTP routing, bounded JSON input, static asset allowlist and errors      |
| src/commerce.js and runner.js | Demo session state and real fixed HTTP suites                            |
| test and e2e folders          | Native behavior checks and isolated browser journeys                     |

### Why separate domain rules from rendering

The rule for closing a defect should be the same regardless of which button invokes it. Keeping that rule in a pure domain module makes it testable without browser timing. Browser tests then check that the UI collects the right data and displays the outcome. This separation helps explain failures and limits duplicated policy.

### What the server does not provide

The local workspace is not a hosted database service. There are no production roles, shared project permissions or real customer accounts. Demo credentials are public fixtures, and demo orders do not process money.

Roman Telugu memory cue: Business rules model file lo untayi. UI data collect chesthundi. Native tests rules ni, Playwright complete user journey ni verify chesthayi.

## Understand the important domain rules

| Concept              | Meaning in this project                                         |
| -------------------- | --------------------------------------------------------------- |
| Requirement revision | Changes when a criterion or its risk assessment changes         |
| Case version         | Changes when title, steps or expected behavior is edited        |
| Review binding       | Review records the current criterion revision for a case        |
| Session snapshot     | A copy of design details and versions at session creation       |
| Fresh evidence       | Latest result matches current versions and has passing evidence |
| Retest closure       | A newer passing session supports closing the linked failed case |

### Walk through a concrete change

A reviewed case at criterion revision 1 is executed in Session A. Its result passes. The criterion changes to revision 2. Session A still records what was checked at revision 1. The application now requires design review, and its release logic treats the older result as stale. Reviewing the design alone does not execute it; Session B still needs a recorded result and evidence.

### Backups and UI rollback

Backups are versioned JSON. Import reconstructs allowed fields and validates collection limits, IDs, links and outcome states before replacing memory. Invalid imports preserve the current collection. Validation checks structure and relationships; it cannot prove that an observation really occurred.

A shared 2 MB UTF-8 budget keeps the collection inside the supported backup envelope. The UI rolls back a mutation if it would exceed that budget. A local-storage quota failure still requires exporting a backup. Project deletion needs confirmation and changes memory first; saving afterwards updates the browser backup.

### Know the limits

The collection supports 5 projects, with up to 30 criteria, 100 designs, 20 sessions and 100 defects per project. It retains the most recent 200 activity events. This activity list is useful history, not an immutable or authenticated audit trail.

## Explain automated checks and CI evidence

The verified release has 40 native tests and 54 browser checks. The browser count represents 27 behaviors across desktop Chromium and Pixel 7 mobile emulation. Emulation is not testing on a physical phone, and Chromium coverage does not establish Firefox or WebKit support.

### Native checks

Native Node tests exercise scenario validation, provider contracts, HTTP behavior, commerce state, risk calculation, CSV export safety, bug formatting, revision invalidation, defect closure and backup links. Controlled AI gateway doubles test the adapter boundary without making paid or live model calls.

### Browser checks

Each browser test owns a fresh app server on an ephemeral localhost port. That avoids shared carts, execution history and fixed-port conflicts between tests. Playwright tests real form interactions, review state, exports, privacy behavior, retests, keyboard operation and responsive layout. Axe scans provide partial accessibility evidence, not full conformance certification.

### GitHub Actions

Native checks run on Node 22 and 24. The browser job installs locked development dependencies and Chromium.

Push, pull request, manual dispatch and daily scheduled runs invoke the workflow.

HTML and JUnit reports are produced. Failures retain screenshots, video and traces; passing runs do not manufacture failure artifacts.

The browser artifact is retained for 14 days. Daily test runs create evidence, not fake contribution commits.

### Distinguish the three result counts

CI checks verify the repository. The built-in HTTP lab runs smoke 5, regression 12, or diagnostic 13 assertions. The diagnostic suite deliberately fails one expectation as a triage exercise. Workspace passes are manually recorded outcomes. Do not add these different counts together or describe manual entries as automatic test execution.

Roman Telugu memory cue: GitHub green ante aa commit checks pass. Manual workspace lo Passed select cheyadam CI test count ni penchadu.

## Rehearse a clear live demonstration

Use synthetic data and practise first. Allow six to eight minutes. Describe each observation before clicking the next control. Keep the known green CI run and a local HTML report available as backup.

| Step | What to demonstrate                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Open the GitHub README, identify the purpose and show the verified Actions run.                                                       |
| 2    | Open the local Test lab, run Commerce regression and inspect its 12 real HTTP assertions.                                             |
| 3    | Try Demo commerce sign-in, add a product and place a demo order. Explain that no payment occurs.                                      |
| 4    | Create a QA workspace project, add a criterion and a test design, and review it.                                                      |
| 5    | For defect workflow training, explicitly label a simulated failed observation as an example; record evidence and link a Major defect. |
| 6    | Open Draft Jira report. Show the expected and actual facts and the questions still needing confirmation.                              |
| 7    | Return to the project, create a newer passing retest and close the defect. Explain the readiness wording.                             |
| 8    | Change the criterion. Show that old passing evidence no longer establishes readiness for the current revision.                        |
| 9    | Save locally, export the backup and download the release review. Explain where data lives.                                            |

### Keep the demonstration honest

The included workspace-example.json file contains synthetic states for learning. Say so when using it. It demonstrates lifecycle decisions, not a real customer defect. For genuine execution evidence, show the API test lab, browser reports and CI results.

### If time is short

Show the README, one real HTTP run, one requirement change and its evidence gap. A clear three-minute explanation of those relationships is stronger than rapidly clicking through every form.

## Answer common QA interview questions

**What problem does QualityPilot solve?**
It connects criteria, test designs, observations, defects and release review. Supporting tools reduce repetitive drafting, while version checks stop older evidence from silently covering changed requirements.

**How is a test case different from a scenario?**
A scenario describes a condition or journey to investigate. A case gives specific prerequisites, data, steps and expected results. Baseline prompts need refinement before they become usable designs.

**How do you choose expected results?**
I use approved acceptance criteria or confirmed product rules. If behavior is unclear, I record a clarification question rather than inventing a requirement.

**What is severity versus priority?**
Severity describes impact; priority describes when the team should address it. The local builder records a tester severity assessment and leaves priority for triage.

**What makes a useful bug report?**
A reproducible summary, environment, prerequisites, exact steps, expected and actual results, frequency and sanitized evidence. Unknown facts should remain explicit.

**How do you prioritize a regression set?**
I consider changed areas, business impact, likelihood and critical journeys. The planner score is a simple heuristic. I explain why a case matters rather than relying only on its numerical score.

**Can you guarantee a bug-free release?**
No. Tests provide evidence within a defined scope. I communicate untested areas, stale evidence, important open defects and residual risk so the responsible people can decide.

**How does this help different QA levels?**
Juniors get repeatable design and reporting habits. Mid-level testers get execution and defect continuity. Seniors can demonstrate change impact, risk reasoning, release blockers and architectural tradeoffs.

Roman Telugu memory cue: Answers ni word-for-word memorize cheyyakandi. App lo oka example chupinchi mee words lo explain cheyyandi.

## Answer architecture and automation questions

**Why use JavaScript and a small Node runtime?**
The same language supports the UI, domain rules and tests. Native HTTP, fetch and the test runner keep runtime dependencies at zero. The tradeoff is explicit routing and validation code that must remain understandable.

**Why use isolated servers in browser tests?**
Each test receives fresh state and an ephemeral port. This avoids order dependence, shared-session leakage and clashes over one fixed port. It also makes failures easier to reproduce.

**Why are criteria revisions and case versions separate?**
A requirement can change without an immediate design edit, and a design can be improved without changing the business rule. Separate versions identify which definition a recorded result actually checked.

**Can someone change closure evidence silently?**
A result supporting a closed defect is protected by a domain guard. Reopen the defect before correcting that result, or create a new session. The local activity list itself is not an authenticated audit system.

**How is checkout retry safety implemented?**
The demo checkout accepts an idempotency key per session. Retrying a successful key returns its original order. A new intended order needs a new key. No real payment gateway is involved.

**How do you handle malformed inputs and external output?**
The HTTP boundary limits JSON size and validates fields. AI adapter output is validated and errors are sanitized. UI text uses DOM text nodes. Workspace backup import checks an allowlisted schema and links.

**Is AI doing the testing?**
No. Default scenario prompts and triage are deterministic; the bug builder and connected workspace are local tools. An optional HTTPS gateway adapter exists, but live provider integration and model quality have not been verified.

**Why not describe this as a production platform?**
The current release has no shared database, production authorization or operational service model. Those capabilities would require new design and validation. The portfolio demonstrates the working local scope accurately.

## Explain defects limitations and responsible use

### Real defects caught during development

| Defect | Evidence and correction                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QP 001 | Malformed option markup prevented selection of AI mode. A browser interaction test exposed it; the markup was corrected.                                           |
| QP 002 | Automated accessibility checks found supporting text below the normal-text contrast threshold. Colors were darkened and scans rerun.                               |
| QP 003 | Linux mobile CI found saved-history overflow and intercepted clicks. Grid tracks and flex minimum widths were constrained; a long-story regression test was added. |

Explain the failure, evidence, root cause, correction and regression check. For QP 003, the important lesson is that a local pass did not replace Linux CI verification. The fix was checked in a new remote run.

### Important current limitations

No production authentication, shared team database, real payment processing or deployment-hardening claim.

Browser storage and manual evidence references are not encrypted or authenticated by this app.

Screenshots in the bug builder are local references, not automatically understood or uploaded to Jira.

AI provider behavior, model quality, load tests, Firefox, WebKit and manual screen-reader checks remain outside verified scope.

Schema validation protects structure and links; it does not establish the truth of imported manual results.

### Use the project responsibly

Practise with synthetic examples. Follow company policy before entering workplace requirements or screenshots. Do not include credentials, private customer data or employer source code in a public portfolio. Copying or downloading a report intentionally creates another copy under your control.

For the current local portfolio scope, the implementation and checks are ready to demonstrate. Software still needs maintenance when dependencies, requirements or operating conditions change. A completed milestone is not a promise that no development will ever be needed.

## Prepare yourself before the interview

### A short learning sequence

First session: explain the problem and module map aloud without looking at the guide.

Second session: execute the real demo store and API regression. Read one assertion and explain expected versus observed behavior.

Third session: create a workspace, change a criterion, and explain review invalidation and old snapshots.

Fourth session: rehearse a clearly labeled defect/retest example and the Jira draft.

Final rehearsal: demonstrate the project in six minutes and answer the questions in your own words.

### Essential vocabulary

| Term             | Plain meaning                                                            |
| ---------------- | ------------------------------------------------------------------------ |
| Traceability     | A visible link from criterion to case, result and defect                 |
| Snapshot         | A recorded copy of the design used in a session                          |
| Stale evidence   | Evidence that no longer matches the current definition                   |
| Idempotency      | A retry key returns the same completed operation result                  |
| Contract test    | A check that an input or response follows its defined shape and behavior |
| Domain invariant | A rule that must hold regardless of which UI action calls it             |
| Residual risk    | Uncertainty that remains after the available testing                     |

### Before you share the screen

Confirm which GitHub commit you will show and that its Actions run is green.

Start the app, open the relevant views and clear private data from the screen.

Keep a synthetic workspace backup and the generated browser report ready.

Know one real defect story and one tradeoff you can explain confidently.

### Commands to remember

npm ci

npx playwright install chromium

npm start

npm run test:all

npm run report

Open http://127.0.0.1:3000. The optional message that .env was not found is normal when no AI gateway is configured. Restart the server after server-code updates. Review the README and docs/connected-workspace.md when you need implementation detail.

Roman Telugu memory cue: Code mottham memorize cheyalsina avasaram ledu. Purpose, oka complete workflow, oka real bug, important rules, limitations clear ga explain cheyyandi.

# QualityPilot Project Understanding and Interview Guide

Prepared for Prapul | Local portfolio release 1.4

QualityPilot is a JavaScript QA portfolio application that connects test design, manual execution evidence, defects and release review. This guide explains what it does, why the design matters, and how to demonstrate it honestly in an interview.

The main lesson is simple: a passing result is useful only when the requirement, test design and evidence are still relevant. The project demonstrates that relationship alongside genuine automated API and browser tests.

### Verified project snapshot

| Item                   | Verified position                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Release scope          | 1.4 local portfolio with guided planning and compatibility tracking                                          |
| Automated checks       | 52 native tests and 80 desktop and mobile Chromium checks                                                    |
| Published CI reference | Release 1.3 revision 025c95a passed run 41244540826. Check Actions for the latest 1.4 run after publication. |
| Runtime                | JavaScript ESM and Node.js 22.9 or newer; no runtime dependencies                                            |
| Operating scope        | Local portfolio application; manual evidence remains user reported                                           |

### How to use this guide

Read the purpose and module map before memorizing any interview answer.

Practise the junior and mid-level workflows in the app using synthetic data.

Study the architecture and lifecycle rules, then rehearse the demonstration.

Use the questions to test your understanding. Explain unfamiliar code only after reading and running it.

Repository: https://github.com/prapulinet/qualitypilot

Latest workflow evidence: https://github.com/prapulinet/qualitypilot/actions

Roman Telugu memory cue: Project features list matrame kaadu; requirement nunchi evidence, defect, release decision varaku sambandham explain cheyyali.

## Explain the project in an interview

### A natural sixty second introduction

QualityPilot is my JavaScript QA portfolio. QA Launchpad guides a tester from requirement clarification through reviewed designs, observations, defects and release review. It also includes live local API checks, reusable contract assertions and Playwright browser automation.

Its main design feature is version awareness. When a requirement or test design changes, older evidence cannot automatically establish readiness for the new version. The release report explains missing reviews, stale evidence and important open defects. A human still makes the release decision.

The current local application needs no AI key or Jira access. It has 52 native checks and 80 desktop and mobile browser checks. Before a demo, I check the latest GitHub Actions run for the exact revision. It is a portfolio demonstration, so I distinguish its tested features from production capabilities outside its scope.

### Expand the explanation when asked

The starting problem is fragmented QA work: requirements in one place, test notes somewhere else, and bug reports without clear expected behavior or evidence. QualityPilot brings those links into one local workflow. I can demonstrate a reviewed design, an observed failure, a linked defect and a newer passing retest.

The manual workflow and the automated checks are separate. Recording a manual pass does not increase the CI test count. The API lab executes fixed HTTP assertions against its demo commerce service; Playwright tests the application through the browser. The local workspace records human observations and artifact references.

I chose a small runtime and separated domain rules from UI rendering. That makes lifecycle rules testable without launching a browser. Browser tests then verify that the complete user journeys, forms, exports and error handling work together.

### How to present your contribution

Describe the work you can demonstrate: decisions you understand, code paths you have read, defects you investigated, and checks you ran. If asked about development assistance, describe the tools you used accurately. Do not claim years of experience, production users or independent authorship that you cannot substantiate.

Roman Telugu memory cue: Short answer lo problem, workflow, important decision, test evidence cheppandi. Senior laga sound avvadam kanna decisions enduku teesukunnamo ardham chesukovadam mukhyam.

## Understand the nine application areas

Each area has a distinct purpose. Start with QA workspace for a connected project, then use the supporting tools when they help a specific testing task.

| Area               | Practical purpose                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| QA Launchpad       | Guided workflow, feature campaign prompts, decision tables, API contracts and a manual Compatibility Matrix.                            |
| Daily workbench    | Story clarification, exploration, screenshot annotations, data probes, regression tags, report comparison and guided checklists.        |
| QA workspace       | Projects, acceptance criteria, reviewed designs, session snapshots, observed results, defects, retests and release review.              |
| Bug report builder | Turn an observation and known facts into an editable Jira-ready text draft. Unknown details remain questions.                           |
| Coverage planner   | Link criteria to deterministic positive, negative and boundary prompts; score risk and track manual review or evidence.                 |
| Scenario studio    | Generate generic baseline prompts, review them, keep the last eight drafts and export JSON. Optional AI gateway requires configuration. |
| Test lab           | Execute real local HTTP smoke, regression and diagnostic suites; inspect assertion evidence and download results.                       |
| Demo commerce      | A synthetic store with sign-in, products, isolated cart, integer totals, checkout retry safety and order ownership.                     |
| Project guide      | An in-app explanation of the earlier workbench and its boundaries. Use repository docs for the connected workspace walkthrough.         |

### Know where data lives

Launchpad, Daily Workbench and Compatibility Matrix inputs stay in the current tab unless explicitly exported or handed to workspace. Workspace changes begin in memory. Save locally explicitly writes its projects, evidence references and defects to browser storage. Export JSON for a separate backup. Coverage and scenario drafts have their own browser storage. The bug builder keeps details only in the current tab unless you intentionally copy or download them.

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

### Execution paths

Manual path: browser UI to pure domain rules and in-memory projects, with explicit save or export. Automated paths: Test lab to Node HTTP API and fixed commerce suites; contract CLI to shared assertions and recorded responses. Playwright independently drives the browser against fresh app servers.

| Code location                                 | Responsibility                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| web/workspace-model.js                        | Revisions, lifecycle guards, snapshots, backup schema and release policy |
| web/workspace.js                              | Forms, selection, local persistence, import and UI rollback              |
| web/coverage-model.js                         | Risk summaries and safe CSV export                                       |
| web/bug-model.js                              | Deterministic bug drafts and explicit unknown details                    |
| src/server.js                                 | HTTP routing, bounded JSON input, static asset allowlist and errors      |
| src/commerce.js and runner.js                 | Demo session state and real fixed HTTP suites                            |
| web/sdet-model.js and tools/check-contract.js | Shared planning and contract assertions for browser and Node CLI         |
| web/compatibility-model.js                    | Bounded manual environment and build records with validated backups      |
| test and e2e folders                          | Native behavior checks and isolated browser journeys                     |

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

The local release has 52 native tests and 80 browser checks. The browser count represents 40 behaviors across desktop Chromium and Pixel 7 mobile emulation. Emulation is not testing on a physical phone, and Chromium coverage does not establish Firefox or WebKit support.

### Native checks

Native Node tests exercise scenario validation, provider contracts, HTTP behavior, commerce state, risk calculation, CSV export safety, bug formatting, revision invalidation, defect closure and backup links. Campaign, decision-table, compatibility and CLI checks test their domain guards. Controlled AI gateway doubles test the adapter boundary without making paid or live model calls.

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

## Use the Daily Workbench effectively

Daily Workbench contains eight small local tools. Choose a tool for the current testing question, keep the resulting artifact, and connect confirmed designs or findings to the appropriate workflow. These tools reduce repetitive preparation; they do not infer a complete product specification.

| Tool                      | Practical use                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Story readiness           | Record criteria, limits, roles, test data, recovery and dependencies; download unanswered clarification areas.   |
| Exploratory session       | Set a mission and timebox, capture actual observations and evidence references, then draft a bug from a finding. |
| Screenshot comparison     | Load expected and actual UI images, zoom, add numbered notes, and export annotated PNGs and notes.               |
| Test data builder         | Generate boundary values and additional probes from confirmed integer or text-length rules.                      |
| Regression selection      | Match explicit changed module tags to declared case and dependency tags; review unmapped risk.                   |
| Automation inbox          | Import JUnit or Playwright JSON and compare matching test identities across runs.                                |
| Accessibility walkthrough | Record keyboard, focus, labels, zoom and screen-reader observations.                                             |
| Security walkthrough      | Record agreed permission, session, input, retry and sensitive-data checks.                                       |

### Understand the evidence boundaries

Image annotations are human observations, not automatic design interpretation. Regression tags are declared mappings, not source-code impact analysis. A report import does not execute or authenticate its tests. Retry recovery remains visible as flaky, and a missing previous test is not counted as passed.

The workbench keeps inputs in this tab. Download before refresh. Completed guided checks require observations and evidence; Not applicable requires a reason. Do not upload workplace screenshots or requirements without following company policy.

Roman Telugu memory cue: Tool select chesi artifact save cheyyandi. Imported report ante tests ippudu run ayyayani kaadu; screenshot difference ante automatic ga bug ani kaadu.

## Build a guided test campaign

QA Launchpad gives a junior tester a visible route through Understand, Design, Check APIs, Execute, Investigate and Review release. The links open tools; they do not mark the work completed or establish release readiness.

### Create a useful starting pack

Enter a feature name and choose General, Account, Commerce, Upload or API.

Supply one to eight distinct confirmed acceptance criteria. Each receives positive, negative, boundary and recovery design prompts.

Answer the profile questions with the responsible people. Default risk starts at neutral 3 by 3 and needs assessment.

Add the campaign to QA workspace or download its compatible JSON backup. Existing projects are preserved; duplicate campaign imports are rejected.

### Move from prompts to executable cases

Every generated expected result contains [NEEDS CONFIRMATION]. This deliberately stops approval. Replace it with approved behavior, specify exact steps, data and prerequisites, then review the current design. Only after review should you start a session and record what happened.

For example, the actual demo criterion may say that checkout empties the cart and returns an order reference. Refine the positive prompt into sign-in, add a known product, confirm the total, checkout, verify the reference and inspect the empty cart. Define negative and recovery expectations from the actual API rules.

### Explain the handoff design

The browser sends a local campaign event. Workspace reconstructs the allowed backup schema, checks project and byte limits, and appends one project transactionally. No existing project is replaced. No execution result is created. The five-project and two-megabyte collection limits still apply.

Roman Telugu memory cue: Generated pack ante starting draft. Expected result confirm chesi review chesina tarvata execute cheyyali. Import chesinanduku pass count raadu.

## Model business rules with decision tables

Decision Table Studio helps make combinations visible when a feature depends on several binary conditions. Enter up to five distinct True or False conditions. The tool enumerates two to thirty-two combinations and leaves the expected behavior for you to confirm.

### An illustrative rule

The following is a fictional learning rule, not an implemented QualityPilot permission policy: allow an action only when both an identity is valid and its role is permitted. Use the real approved rule when building your own table.

| Valid identity | Permitted role | Illustrative expected outcome |
| -------------- | -------------- | ----------------------------- |
| False          | False          | Reject the action             |
| False          | True           | Reject the action             |
| True           | False          | Reject the action             |
| True           | True           | Allow the action              |

### Handle applicability explicitly

Every included row requires an expected outcome. Every excluded combination requires a reason. Do not exclude an awkward case just because it is difficult to set up. Confirm that the state is impossible or outside the agreed scope and preserve that explanation in the CSV.

Download the decision CSV to retain the complete table, unresolved outcomes and exclusion reasons. Add only the fully specified included rows to a new QA workspace project. These designs remain unreviewed until a tester reviews them. The workspace project does not contain excluded rows; retain the CSV separately.

### Know what enumeration cannot prove

A binary table is useful for rule interaction, but it does not cover arbitrary input values, sequence-dependent behavior, timing or every integration state. It is not pairwise generation or proof of complete coverage. Combine it with boundaries, state transitions, end-to-end journeys and exploration.

Roman Telugu memory cue: Conditions combinations tool generate chesthundi. Expected outcomes business rules nunchi ravali. Exclusion ki reason undali; table CSV separate ga retain cheyyandi.

## Reuse API contracts in the browser and CI

API Contract Studio evaluates a JSON response record against explicit assertions. The same pure engine runs in the browser and tools/check-contract.js. This lets a tester develop checks interactively and reuse them in automation without maintaining different comparison logic.

### Capture or supply a response

Capture local health response performs a real GET to this app’s fixed /api/health endpoint. It records status, content type, elapsed fetch and body-parse time, and JSON body. To inspect another system, use a permitted recorded response from your approved API process. Importing it does not call that API or authenticate the record.

| Assertion concept  | Example or boundary                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Path               | /body/items/0/id uses JSON Pointer; ~1 escapes a slash and ~0 a tilde.                     |
| Equality and types | Structural equality distinguishes false, null, missing fields and mismatched types.        |
| Other operators    | exists, absent, min, max, length and includes; no scripts or regexes execute.              |
| Input limits       | One MB per JSON input; up to fifty uniquely named rules; nesting depth thirty.             |
| Evidence           | Edited inputs invalidate earlier displayed results. Export current JSON evidence or JUnit. |

### Use the assertion form and command line

Add assertions with the form, or edit/import a versioned JSON suite. Download the reusable suite and response through your approved capture process. Then run:

node tools/check-contract.js suite.json response.json --junit results.xml

Exit 0 means assertions matched; 1 means an assertion failed; 2 means invalid input or an execution/write error. Invalid input writes a failing validation testcase when the JUnit destination is writable. The provided health-response.synthetic.json is training data, not a live API result.

Import the resulting JUnit into Automation Inbox or draft a bug from failed checks. These assertions are not full JSON Schema, OpenAPI validation, load testing or proof of authorization coverage.

Roman Telugu memory cue: Browser lo design chesina rules same engine tho CLI lo run avutayi. Offline response checks ni live API calls laga explain cheyyakandi.

## Track compatibility across builds and environments

Compatibility Matrix adds the environment context that a simple pass count can hide. Create a matrix scope, add environment names, build identifiers and browser or operating-system details, then add journeys with confirmed expected behavior. Up to eight environments and eight journeys create at most sixty-four planned combinations.

### Record each actual observation

Execute the journey separately in the agreed environment. Passed, Failed and Blocked outcomes require an observed result and evidence reference. Not applicable requires an explicit exclusion reason. Unrecorded combinations remain Not run. These are manual records; the tool does not launch those browsers or run tests on a physical device.

| Synthetic context         | Example record                                                          |
| ------------------------- | ----------------------------------------------------------------------- |
| Build B1 and browser A    | Failed: order reference absent, with a synthetic capture reference.     |
| Build B2 and browser A    | Starts as Not run. A result from B1 does not populate this new context. |
| Unsupported agreed device | Not applicable only with the confirmed support-scope reason.            |

### Keep context and evidence together

A saved Failed outcome can draft a bug with journey expectation, actual observation, environment, build and browser details. Confirm exact reproduction steps before filing. Definitions are fixed inside a matrix; start a new scope when requirements change instead of silently reusing old evidence.

Download CSV for the complete planned matrix and JSON for restoration. Inputs remain in the current tab until exported. Replacing the matrix requires confirmation. Malformed backups preserve current state; duplicate links, excessive dimensions and the 256 KB UTF-8 backup budget are validated. Over-budget mutations roll back.

Imported observations are user supplied and not independently verified. Passed records do not certify all browser versions, devices or requirements. Keep original artifacts under your approved evidence process.

Roman Telugu memory cue: Build maarithe kottha context ki Not run nunchi start cheyyandi. Browser peru enter chesinanduku aa browser lo test automatic ga jaragadu.

## Demonstrate the current release with confidence

Use a short story and synthetic data. The aim is to explain decisions and evidence clearly, not click through every screen. Keep the latest GitHub Actions run available and identify which revision it verifies.

### A focused current workflow

Open QA Launchpad and show how its six steps guide a tester.

Build one campaign from a confirmed criterion. Show that unresolved expected behavior prevents approval in QA workspace.

Use a small decision table and explain one included outcome and one justified exclusion.

Capture the real local health response, check assertions, change one expectation and show the resulting failure evidence.

Export JUnit and show it in Automation Inbox. Explain the difference between an imported record and a newly executed check.

For compatibility training, label the example synthetic, record one failure with build/browser context, and hand it to Bug Builder.

Return to QA workspace for actual version, retest and release-review reasoning.

### Questions the new tools help answer

**Why share the browser and CLI engine?**
The same assertion semantics and validation rules are reused. Browser tests verify form interactions and exports; native tests verify the engine and CLI exit/report behavior.

**Can generated cases be executed immediately?**
They are design prompts. I confirm requirements, data, steps and expectations, then review the current design before recording execution.

**How do you prevent misleading compatibility evidence?**
I keep build and browser context separate, leave unexecuted combinations as Not run, require observations and evidence, and preserve exclusion reasons.

**What is the strongest senior level explanation?**
I explain where evidence comes from, which version it applies to, what validation checks and cannot check, and which risks remain for human review.

Roman Telugu memory cue: Oka real API check, oka guarded manual flow, oka clear tradeoff chupinchandi. Features count kanna evidence explain cheyadam important.

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

Open http://127.0.0.1:3000/#launch for the guided workflow. Use the later chapters for current tools. The optional message that .env was not found is normal when no AI gateway is configured. Restart the server after server-code updates. Review the README and docs/connected-workspace.md when you need implementation detail.

Roman Telugu memory cue: Code mottham memorize cheyalsina avasaram ledu. Purpose, oka complete workflow, oka real bug, important rules, limitations clear ga explain cheyyandi.

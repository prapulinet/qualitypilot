# Daily workbench

QualityPilot 1.2 adds eight local tools for repeatable QA work. Open **Daily workbench** in the sidebar. No AI key, Jira account or integration permission is needed. The workbench keeps inputs in the current tab only; refresh clears them. Download what you need before leaving. Handing a draft to Bug Builder preserves supplied facts in that tab, where you can edit and copy the report.

## Story readiness

Enter a story and answer six review areas: acceptance criteria, limits, roles, data, recovery and dependencies. The report shows unanswered areas as clarification questions. This is a structured self-review, not automatic semantic analysis, approval or a completeness score. Ask the responsible people to confirm ambiguous expected behavior. Download the clarification report.

## Exploratory sessions

Set a mission and a 1–120 minute timebox. Record observations with evidence references. A clock shows remaining time; expiry does not discard notes or automatically end testing. End explicitly, download JSON, or select a finding and draft a bug. Starting another session asks before replacing notes. Up to 100 observations are retained per session. Evidence references are user-supplied text, not authenticated attachments.

## Screenshot comparison

Choose expected and actual PNG, JPEG or WebP images up to 8 MB and 16 million pixels each. Compare them side by side, zoom to 150% or 200%, and pan within each image. Describe a marker, then click its location, or place a centre marker using the keyboard. Undo markers and export the annotated PNG and numbered notes separately. Up to 30 markers are supported per image. The longest edge is reduced to 1600 pixels; annotation coordinates refer to that displayed resolution. Replacing an image clears its annotations. Screenshots are decoded locally, never sent to AI or Jira. This tool does not automatically interpret designs or classify pixel differences as defects. Attach downloads manually to the final bug.

## Test data

Choose an inclusive integer range or text-length rule. The builder proposes values around the supplied boundaries, deduplicates collapsed ranges and includes blank, whitespace, Unicode and other probes. Integer limits are bounded to ±1 million; text lengths to 0–256 UTF-16 code units. ASCII boundary strings test these code units; real products may instead count graphemes, code points or bytes. Confirm that distinction. Additional probes have unresolved expected behavior until product rules are confirmed. CSV neutralizes formula-like cells with an apostrophe: use the displayed value when exact input matters.

## Regression selection

Provide changed tags and a JSON case catalogue:

```json
[
  {
    "id": "TC-01",
    "title": "Checkout confirms an order",
    "modules": ["checkout"],
    "dependencies": ["cart", "session"]
  }
]
```

Case-insensitive exact matches against explicitly declared tags suggest a selection and explain why. Tags are flat declarations, not a dependency graph or source-code analysis. A non-match is a mapping gap to review, not proof that a case can be omitted. Include critical journeys and cross-cutting risks manually. Unique IDs are required; up to 500 cases and 30 tags in each tag list are supported. Export the selection CSV after reviewing it.

## Automation inbox

Import a current report and optionally a previous report. Supported inputs are JUnit XML and Playwright's **JSON reporter** output, up to 2 MB and 2000 test identities. Playwright's HTML report is not a JSON input. For example:

```sh
npx playwright test --reporter=json > results.json
```

Use shell output redirection that produces UTF-8. JUnit can be obtained from this repository's `test-results/junit.xml`. Import and review a permitted report; it is not executed or authenticated by importing it.

Playwright attempts retain total duration and retry count. A final expected result after an unexpected attempt is shown as flaky; declared expected failures are respected. Failed, timed-out and interrupted unexpected outcomes are failures. JUnit derives outcomes from testcase failure/error/skipped elements; supported flakyFailure/rerunFailure markers remain visible. JUnit retry counts reflect available retry markers only. Missing testcase time is treated as zero. Unsupported vendor metadata is not inferred.

Identity uses Playwright project/file/title paths or JUnit suite/class/name paths. Duplicate identities are rejected rather than silently merged. Comparisons show status transitions and previous identities absent from the current report; missing tests are not counted as passes. Run-level Playwright errors, malformed XML, DTD/entity declarations, invalid durations and unsupported structures are rejected. A failed import clears that input slot. Select a failed or flaky result to draft a bug, then confirm environment, reproduction and expected behavior. Export comparison CSV for review.

## Accessibility and security walkthroughs

Record Not run, Passed, Failed, Blocked or Not applicable for each prompt. Completed checks need observations and evidence; Not applicable needs a reason. Failed checks with evidence can be handed to Bug Builder. Downloads preserve unexecuted checks explicitly. These are partial guided reviews, not certifications or active scanners.

- Accessibility prompts cover keyboard journeys, focus, labels/errors, zoom/reflow and screen-reader tasks. [W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/) explains why tools and human assessment complement each other.
- Security prompts cover permission boundaries, sessions, input/output, retries and sensitive data. Use agreed harmless probes in an authorized environment. [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) provides broader methodology.

## Interview demonstration

Explain an unclear checkout story, download its open questions, generate data for the actual demo cart's 1–5 quantity rule, select regression tests using a declared checkout tag, and run the genuine Test lab regression. Then import the generated JUnit report. For defect workflow training, label any simulated finding clearly; demonstrate its handoff to Bug Builder. Show a real UI comparison using permitted screenshots and describe the review judgment. Connect this work to the existing QA workspace for versioned designs, retests and release review; workbench exports are separate artifacts, not automatic workspace imports.

The original Word learning guide documents the verified 1.1 baseline. Read this supplement for the 1.2 tools and current verification notes for updated test counts.

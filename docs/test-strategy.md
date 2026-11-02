# Test strategy

## Scope

Offline response comparison is covered by missing/null/type and escaped-key checks, exact ignore accounting, malformed/oversized/deep input rejection, difference limits, real JSON download assertions, stale-result invalidation, unsafe-markup rendering and desktop/mobile accessibility checks. See [response comparison](response-comparison.md).

Validate a local JavaScript QA workbench with versioned manual workflows, guided campaigns, decision tables, reusable contract checks, report comparison, an optional gateway boundary, demo commerce and a fixed HTTP suite runner. Risk priorities: misleading provenance, invalid inputs, cross-session data exposure, incorrect totals, duplicate checkout, unsafe rendering and misleading test evidence.

| Risk                                                | Evidence                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Templates mistaken for AI                           | Source labels, baseline source assertion and unavailable-gateway recovery |
| Invalid requests mutate state                       | Boundary, malformed JSON, media-type and oversized-body tests             |
| Wrong cart or currency values                       | Integer-cent calculations and quantity-limit tests                        |
| Session data leaks                                  | Cart and order ownership checks                                           |
| Checkout retry duplicates an order                  | Idempotency and cart-clearing assertions                                  |
| Generated markup executes                           | Browser test injects markup and verifies text-only output                 |
| Shared state causes flakiness                       | Fresh server per API/browser test and disposable suite sessions           |
| Failure analysis overclaims                         | Explicit diagnostic expectation and rule-based evidence assertions        |
| UI unusable on mobile/keyboard                      | Responsive overflow and focus/activation checks                           |
| Low contrast or missing accessible names            | axe WCAG A/AA scans across nine views on desktop/mobile                   |
| Generated designs appear already verified           | Placeholder approval guard and zero-execution campaign assertions         |
| Campaign handoff overwrites existing work           | Append-only handoff, duplicate rejection and collection rollback guards   |
| Missing/null/type mismatch creates false API passes | JSON Pointer, structural equality and strict validation tests             |
| Invalid CLI input leaves misleading prior artifacts | Process exit-code checks and failing validation JUnit replacement         |

## Layers

The connected workspace adds requirement-change impact, editable design versions, snapshot retention, explicit local persistence, malformed-backup rejection, confirmed deletion, failed-result handoff, retest-based closure/reopening and release-policy checks. Its manual results are not added to automated CI pass counts.

- **54 native tests:** scenario behavior, HTTP contracts, commerce boundaries, run orchestration, simulated provider contracts, planning helpers, decision tables, reusable assertion rules, CLI behavior and compatibility matrix validation/rollback.
- **84 browser checks:** 42 workflows/assertion groups on desktop and mobile Chromium. The mobile project uses device emulation, not a physical phone. The suite-wide budget is five minutes; each test retains its 20-second timeout.
- **Built-in test lab:** smoke (5), regression (12), diagnostic (13, including 1 intentional failure). These are separate from the repository test counts.
- **Visual inspection:** actual desktop/mobile screenshots captured from the running app and inspected for layout.

## Exit criteria

Syntax, formatting, native and browser checks pass. Documentation matches implemented behavior. Credentials stay out of source. Accessibility violations caught by automated checks are fixed. Remote CI is checked against the pushed head before claiming a remote pass.

## Artifacts

Playwright HTML and JUnit reports are generated on every browser run. Screenshots, videos and traces are retained on failures. CI uploads artifacts for 14 days. API test lab results can be downloaded as JSON; a real example is stored under `docs/evidence`.

## Remaining validation

Live provider integration/model quality, Firefox/WebKit, performance/load, physical devices and manual screen-reader checks are not covered. Automated accessibility scans do not establish full accessibility conformance. Production deployment requires a separate identity and operational design.

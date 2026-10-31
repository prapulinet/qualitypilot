# Test strategy

## Scope

Validate a local JavaScript QA workbench with scenario review, an optional gateway boundary, demo commerce and a fixed HTTP suite runner. Risk priorities: misleading AI provenance, invalid inputs, cross-session data exposure, incorrect totals, duplicate checkout, unsafe rendering and misleading test evidence.

| Risk                                     | Evidence                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Templates mistaken for AI                | Source labels, baseline source assertion and unavailable-gateway recovery |
| Invalid requests mutate state            | Boundary, malformed JSON, media-type and oversized-body tests             |
| Wrong cart or currency values            | Integer-cent calculations and quantity-limit tests                        |
| Session data leaks                       | Cart and order ownership checks                                           |
| Checkout retry duplicates an order       | Idempotency and cart-clearing assertions                                  |
| Generated markup executes                | Browser test injects markup and verifies text-only output                 |
| Shared state causes flakiness            | Fresh server per API/browser test and disposable suite sessions           |
| Failure analysis overclaims              | Explicit diagnostic expectation and rule-based evidence assertions        |
| UI unusable on mobile/keyboard           | Responsive overflow and focus/activation checks                           |
| Low contrast or missing accessible names | axe WCAG A/AA scans across seven views on desktop/mobile                  |

## Layers

The connected workspace adds requirement-change impact, editable design versions, snapshot retention, explicit local persistence, malformed-backup rejection, confirmed deletion, failed-result handoff, retest-based closure/reopening and release-policy checks. Its manual results are not added to automated CI pass counts.

- **40 native tests:** scenario behavior, API contracts, commerce boundaries, run orchestration and simulated provider contracts.
- **54 browser checks:** 27 workflows/assertion groups on desktop and mobile Chromium. The mobile project uses device emulation, not a physical phone.
- **Built-in test lab:** smoke (5), regression (12), diagnostic (13, including 1 intentional failure). These are separate from the repository test counts.
- **Visual inspection:** actual desktop/mobile screenshots captured from the running app and inspected for layout.

## Exit criteria

Syntax, formatting, native and browser checks pass. Documentation matches implemented behavior. Credentials stay out of source. Accessibility violations caught by automated checks are fixed. Remote CI is checked against the pushed head before claiming a remote pass.

## Artifacts

Playwright HTML and JUnit reports are generated on every browser run. Screenshots, videos and traces are retained on failures. CI uploads artifacts for 14 days. API test lab results can be downloaded as JSON; a real example is stored under `docs/evidence`.

## Remaining validation

Live provider integration/model quality, Firefox/WebKit, performance/load, physical devices and manual screen-reader checks are not covered. Automated accessibility scans do not establish full accessibility conformance. Production deployment requires a separate identity and operational design.

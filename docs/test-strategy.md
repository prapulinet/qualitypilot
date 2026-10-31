# Test strategy

## Scope and risks

This increment verifies a local scenario drafting API and its optional AI gateway boundary. Highest risks: misleading AI provenance, invalid provider output, unhelpful error handling, credential leakage and invalid request handling.

| Risk | Evidence |
| --- | --- |
| Templates presented as AI | Baseline source and review flag assertions |
| Missing or oversized user stories | Minimum/maximum boundary tests |
| Invalid request payload | JSON, media type, method and size checks |
| Invalid AI drafts | Empty list, null scenario and missing steps rejected |
| Upstream details exposed | API error sanitization assertion |

## Exit criteria

Source syntax checks and native tests pass; no secrets committed; known limitations documented. CI execution must be checked after publishing. A local pass does not establish production readiness.

## Pending validation

Browser E2E, accessibility audit, cross-browser checks, real gateway integration, timeout simulation, load testing and independent security review are not completed. The UI currently has no automated browser evidence.

## Bug report format

Title; environment; prerequisites; reproduction steps; expected and actual behavior; severity and rationale; screenshot/trace; affected requirement; regression test reference. Use synthetic test data.

# Local portfolio release · v1.0.0

## Implemented

- Responsive scenario studio, test lab, demo store and guide.
- Baseline draft generation, per-scenario human review, last-eight browser history and JSON export.
- Fixed live API suites with actual assertion evidence and downloadable results.
- Synthetic commerce login, catalog, isolated cart, integer totals, idempotent checkout and order ownership.
- Explicit diagnostic failure and rule-based triage tied to observed assertions.
- Optional HTTPS gateway adapter with validated responses and sanitized errors.
- Desktop/mobile browser automation, accessibility checks, HTML/JUnit reports and failure screenshots/videos/traces.
- Daily CI checks, architecture decisions, API contracts, bug reports and real application previews.

## Completion boundary

This release is a local portfolio demonstration. Live model behavior cannot be verified without a provider/key; no key was supplied. Baseline and rule-based modes work independently and are labeled accordingly. Hosted deployment, production accounts/payments and model evaluation are separate work.

## Publishing

Meaningful increments are committed locally. In the terminal already authenticated as `prapulinet`, run from this repository:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\publish.ps1 -IncludeProfile
```

The script checks identity, remote, branch and clean working trees, fetches the remote head, rejects divergence, then pushes each new commit separately without force. It also sets a descriptive repository summary and relevant QA topics. The optional profile flag expects the sibling `prapulinet-profile` checkout used in this workspace; omit it in other clones. Current remote CI must be checked after publishing.

## Daily behavior

The GitHub workflow includes a daily `07:30 UTC` schedule, plus push/PR/manual triggers. It runs checks and retains browser artifacts; it does not generate empty commits or claim new engineering work. Scheduled execution timing is controlled by GitHub.

# Architecture decisions

## ADR 007 · Version evidence and derive decisions

The connected workspace separates current acceptance-criterion revisions, test-design versions and per-session snapshots. Review approval binds to a criterion revision; editing a design invalidates its approval. Release readiness is derived from the newest session, current revisions and open-defect severity, rather than saved as an independently mutable Boolean. The source remains manually recorded evidence and human sign-off is required.

## ADR 008 · Explicit persistence and validated interchange

Local projects use opt-in browser storage plus versioned JSON backups. Imports reconstruct an allowlisted schema and validate identifiers/links before replacing memory. UI mutations enforce the same UTF-8 size budget used by import, so users cannot grow a collection beyond its supported backup envelope. Validation does not authenticate manual claims.

## ADR 001 · Keep the runtime small

Use native Node HTTP, fetch and test runner. Runtime dependencies are zero. Tradeoff: explicit route and validation code must remain small and reviewable. Playwright, axe and Prettier are development dependencies.

## ADR 002 · Separate trust boundaries

Request validation lives in the HTTP layer; commerce state lives in its module; AI output is validated before reaching the browser. Static assets are allowlisted and use a strict Content Security Policy. Browser text is rendered with DOM text nodes.

## ADR 003 · Use integer currency and session ownership

Commerce prices are integer cents. Each synthetic login receives a distinct cart and order store. Checkout replay is idempotent per session. Production authentication, tax, payment processing and inventory are outside this demo.

## ADR 004 · Own state in every test

Each API and browser test owns an ephemeral server. The UI test lab calls fixed local endpoints and creates disposable demo sessions. No arbitrary code or user-supplied target URLs are executed.

## ADR 005 · Keep AI provenance explicit

Baseline templates and rule-based triage are usable without credentials. The gateway adapter is optional, uses HTTPS, rejects redirects and applies a timeout. A real provider is not configured or evaluated in this release. Output requires review.

## ADR 006 · Choose bounded local storage

Retain 20 server runs and 8 browser drafts. Run records reset with the server, and demo sessions expire after an hour. This keeps the local demonstration simple. A hosted multi-user platform would need durable storage, identity, authorization, quotas and operational monitoring.

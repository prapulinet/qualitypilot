# API contract

All mutation bodies use `application/json` and are limited to 16 KiB. Browser cross-origin mutations are rejected. Unknown routes return 404. No production identity system is provided.

| Method | Path                     | Contract                                                             |
| ------ | ------------------------ | -------------------------------------------------------------------- |
| GET    | `/api/health`            | Status and optional AI configuration flag; no credentials            |
| POST   | `/api/scenarios`         | `{story, mode}`; story 15–4000 characters; baseline or ai            |
| GET    | `/api/runs`              | Up to 20 most recent in-memory run records                           |
| POST   | `/api/runs`              | `{suite}`: smoke, regression or diagnostic; one active run at a time |
| GET    | `/api/runs/:id`          | Full result with per-check durations and assertion evidence          |
| GET    | `/api/runs/:id/analysis` | Rule-based triage, explicit provenance and human review flag         |
| GET    | `/api/demo/products`     | Three seeded products; integer USD cents                             |
| POST   | `/api/demo/session`      | Demo credentials; creates a one-hour isolated bearer session         |
| DELETE | `/api/demo/session`      | Invalidates the current bearer session                               |
| GET    | `/api/demo/cart`         | Current session cart                                                 |
| POST   | `/api/demo/cart`         | `{productId, quantity}`; sets quantity to integer 1–5                |
| DELETE | `/api/demo/cart`         | Clears the cart                                                      |
| POST   | `/api/demo/checkout`     | `{idempotencyKey}`; creates a demo order or replays its result       |
| GET    | `/api/demo/orders/:id`   | Only returns orders owned by the bearer session                      |

Demo credentials are public fixtures: `qa@qualitypilot.test` / `TestOnly!123`. No actual accounts, payments or personal data are involved.

Checkout replay keys contain 8–80 alphanumeric/hyphen characters. Retrying a successful key returns the original order, even after the cart changes; use a new key for a new intended order. Keys live only within the session.

## Error semantics

- 400 invalid fields or malformed JSON
- 401 invalid demo credentials or session
- 403 cross-origin mutation
- 404 missing resource or an order not owned by the session
- 405 unsupported method on the scenario endpoint
- 409 empty checkout or another suite already running
- 413 oversized body
- 415 incorrect media type
- 429 demo session limit reached
- 502 failed AI gateway request or invalid provider output
- 503 AI mode selected without gateway configuration

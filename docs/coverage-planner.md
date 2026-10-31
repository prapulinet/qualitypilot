# Risk & Coverage Planner

## Workflow

1. Open Coverage planner. Enter 1–12 distinct acceptance criteria, one per line.
2. Build a plan. Each criterion gets stable AC/TC identifiers and positive, negative and boundary review prompts.
3. Tailor expected behavior to the actual requirement before checking Design reviewed.
4. Set impact and likelihood from 1 to 5. Score = impact × likelihood. High: 15–25; Medium: 8–14; Low: 1–7. These are project heuristics, not a universal standard.
5. Execute the checks yourself and record an evidence note/reference, then save Passed, Failed or Blocked. No outcome is saved without evidence.
6. Inspect gaps and export the CSV for a review or interview walkthrough.

## Metric definitions

- **Designs reviewed:** reviewed checkboxes / planned cases. This does not indicate execution.
- **Manual passes recorded:** cases explicitly saved Passed / planned cases. Evidence is user-reported, not independently verified.
- **High-risk gaps:** high-risk criteria with any check missing review, a passing result or evidence. Failed, blocked and unrun cases remain gaps.
- **Completion message:** requires every planned check to be reviewed, Passed and accompanied by evidence. It explicitly does not grant automated release approval.

The default templates are generic deterministic prompts. Review and execution decisions remain with the tester. A passing result does not prove that a criterion is fully tested outside this plan.

## Storage and exports

One plan is saved in this browser's local storage; building another replaces it. Export first if it must be kept. Evidence fields accept text references; the app does not upload or verify linked artifacts. No confidential production data should be entered.

CSV values are quoted and embedded quotes escaped. Leading spreadsheet formula markers are neutralized, including after whitespace. Data is rendered as text. Saved plans are validated and canonical IDs reconstructed on restore.

## Interview demonstration

Use an order-ownership criterion. Mark it high risk, explain positive/negative/boundary design, record a Failed case with a defect reference, and show why its gap stays open. Distinguish reviewed design, manual evidence and automated CI execution. This demonstrates traceability and risk reasoning without overstating coverage.

# QA Launchpad and reusable contract checks

QualityPilot 1.3 connects planning to the versioned QA workspace and adds reusable API assertions. Open **QA Launchpad** in the sidebar. It guides a tester through Understand, Design, Check APIs, Execute, Investigate and Review release. Links open the relevant existing tool; they do not mark work completed automatically.

## Guided campaigns

Enter a feature name, choose General, Account, Commerce, Upload or API, and supply 1–8 distinct confirmed acceptance criteria. Each criterion receives four design prompts: positive, negative, boundary and recovery. Profile-specific clarification questions are shown before handoff. These are fixed prompts, not semantic story analysis or comprehensive test coverage.

Add the campaign directly to QA workspace without replacing existing projects, or download a compatible workspace JSON backup. Adding the same campaign twice is rejected. The existing 5-project and 2 MB collection limits still apply transactionally. The backup does not include the displayed profile question list; record the answers in the actual requirements and designs before reviewing.

Generated expectations contain `[NEEDS CONFIRMATION]`. Replace these with approved expected behavior, supply exact steps/data, assess the neutral default 3×3 risk scores, and review each design. The existing workspace refuses approval while a clarification placeholder remains. Generating or importing a pack creates no execution results. Workspace Save locally and backup export remain explicit actions.

## Decision Table Studio

Define up to five distinct binary conditions. The studio enumerates 2 to 32 True/False combinations. Each included rule needs a confirmed expected outcome. Each excluded combination needs an explicit reason, such as an impossible state in the agreed model. The tool does not infer business outcomes or decide which combinations are impossible.

Download CSV to retain every combination, unresolved expectation and exclusion reason. Add fully specified included rows as unreviewed test designs in a new QA workspace project. Only included cases are handed off; keep the table CSV as the applicability record. Review before execution. Binary enumeration is not pairwise generation, multi-valued combinatorial testing or proof of complete behavior coverage.

## API Contract Studio

There are two modes of evidence:

- **Live local capture:** the browser requests this app's fixed `GET /api/health` endpoint and records its HTTP status, content type, elapsed fetch/body-parse time and JSON body. It does not accept an arbitrary destination URL.
- **User-supplied response:** paste or import a permitted recorded response from your normal API client or test process. No request is sent to that external API by this tool. Records are not authenticated by importing them.

Use the assertion form to add a rule without editing JSON, or edit/import a reusable suite. Every input change invalidates previous displayed assertion evidence. A suite has this versioned format:

```json
{
  "version": 1,
  "name": "Order response",
  "rules": [
    { "name": "Success", "path": "/status", "op": "equals", "expected": 200 },
    {
      "name": "Reference",
      "path": "/body/orderId",
      "op": "type",
      "expected": "string"
    }
  ]
}
```

A response record uses:

```json
{
  "status": 200,
  "durationMs": 25,
  "headers": { "content-type": "application/json" },
  "body": { "orderId": "SYNTHETIC-ORDER-01" }
}
```

Paths use the JSON string form of [JSON Pointer, RFC 6901](https://www.rfc-editor.org/info/rfc6901/): empty string selects the root; `/body/items/0/id` selects an array member; `~1` escapes a slash in a key and `~0` escapes a tilde. URI fragment pointers and array append notation are not supported. Header keys are normalized to lowercase. Only own properties and strict in-range array indices resolve; missing fields differ from null or false.

Operators are equals (structural JSON equality), type, exists, absent, min, max, length and includes. Types are string, number, safe integer, boolean, array, object and null. min/max require numeric actual values. length supports arrays or UTF-16 string length. includes supports text substrings or structurally equal array members. No expressions, regexes, scripts, OpenAPI validation or full JSON Schema evaluation are executed. Rules are not inferred from response bodies.

Limits: 1 MB per JSON input, 50 uniquely named rules, nesting depth 30, pointer length 500. Status must be an integer 100–599, duration must be non-negative and finite, and headers must have distinct text names/values. Unsupported operators, malformed paths, unknown rule fields and invalid records are rejected before producing assertion evidence. Passing means only those assertions matched that response; it does not establish overall API correctness. A single elapsed local observation is not a load test or server-only processing metric.

Download a reusable suite, JSON assertion evidence or JUnit XML. Import JUnit into Daily Workbench's Automation Inbox for comparison. Failed checks can hand expected/actual facts to Bug Builder; confirm environment, reproduction and approved expectations before filing. Previewed actual values are bounded to 600 characters per rule; original response retention is the tester's responsibility.

## Reuse in Node and CI

The browser and CLI use the same pure assertion module. Run:

```sh
node tools/check-contract.js suite.json response.json --junit contract-results.xml
```

Exit 0 means all assertions matched, 1 means an assertion failed, and 2 means invalid input or an execution/write error. When an output path is supplied, invalid input writes an explicit failing validation testcase instead of retaining an earlier report, if that output is writable. CI must respect the process exit status as well as the JUnit artifact. The CLI checks records; it does not call an API. The caller supplies capture/authentication using its approved process.

The included `docs/evidence/health-response.synthetic.json` is explicitly a synthetic learning fixture. Run it with `docs/evidence/health-contract.json` to learn the CLI; use the browser's Capture local health response action for genuine live local evidence.

## Junior to senior use

| Level                 | Practical activity                                                  | Evidence to explain                                                          |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Junior QA             | Clarify a feature, refine prompts and map simple business decisions | Confirmed criteria, exact expectations, observed results                     |
| Experienced manual QA | Explain excluded combinations, risk and recovery coverage           | Decision CSV, applicability reasons, defect/retest continuity                |
| Automation QA         | Reuse API assertions in browser and Node; investigate failures      | Versioned suite, original response, assertion evidence and JUnit             |
| Senior SDET           | Review architecture, contracts, provenance, rollback and CI policy  | Shared pure checks, validation boundaries, missing coverage and release risk |

Use [OWASP API guidance](https://devguide.owasp.org/en/07-training-education/07-api-top-ten/) to extend agreed authorization and business-flow reviews. Contract matching alone does not test ownership, abuse resistance or operational reliability. Follow company policy before entering requirements, screenshots or response data; use synthetic examples for the public portfolio. Inputs remain in the current tab until explicitly downloaded or handed to workspace. Imported workspace data follows its separate opt-in persistence rules.

This release improves the connected workflow. Domain understanding, exploratory judgment, additional browsers/devices, performance evaluation and production identity/storage remain separate responsibilities. The updated Word guide covers release 1.4; read this page and the Daily Workbench documentation for detailed tool behavior. The [Compatibility Matrix](compatibility-matrix.md) adds manual build and browser context tracking.

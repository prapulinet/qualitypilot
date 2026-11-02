# API Response Compare

Open **QA Launchpad → API Response Compare**. Paste JSON captured from an old build into Before and a new build into After. This offline tool never calls the pasted API, uploads the responses, or needs an AI key. Redact credentials and customer data before use or sharing downloaded evidence.

Example: Before `{"total":100,"timestamp":1}`; After `{"total":120,"timestamp":2}`. Enter `/timestamp` in the optional ignore field. The result identifies `/total` changing from 100 to 120. Check the pricing requirement before deciding whether this is a bug. Download JSON to attach to your investigation.

- Added, removed, value changes and type changes are separate. Missing differs from null. Object key order is irrelevant.
- JSON Pointer paths escape `/` as `~1` and `~` as `~0`. An empty reported path means the root value. Up to 30 exact ignore paths exclude their entire subtree; matched and unmatched ignore paths are reported in the download. A path beneath an added/removed/type-changed parent is unmatched because that parent is reported as a whole.
- Arrays compare by index, not identity. Reordered collections may produce many differences; there is no automatic entity matching.
- Standard JavaScript JSON number precision applies. Represent large identifiers as strings. This is a structural comparator, not a decimal accounting engine, contract validator or automated business oracle.
- Each input is limited to 256 KB UTF-8, combined 20,000 values and depth 40. More than 500 changes rejects the comparison instead of silently truncating evidence. Ignore text is limited to 4096 characters. Malformed JSON and nonfinite numbers are rejected.
- Changing any input clears old results and disables the download until another successful comparison. Data stays in this tab; refresh clears it. Downloads contain the changed values and ignore configuration, not a complete backup of both inputs.

Interview explanation: “I built a deterministic offline JSON comparator to investigate regression changes without requiring company API or AI access. Explicit ignores remain visible in evidence, and stale reports are invalidated when inputs change. The tester still decides correctness from approved requirements.”

# Local Bug Report Builder

Open **Bug report builder**. Describe the issue in your own words, then provide the details you know. The first line becomes a suggested summary unless you supply your own title. Actual result defaults to your observation.

## Expected behavior and missing information

Enter the approved acceptance criterion as expected behavior. The app cannot infer approved business rules from a short observation. Missing expected behavior, steps, environment, evidence, reproducibility and severity remain questions to confirm. The app never asserts a root cause, creates reproduction steps from guesses or assigns a team priority.

Severity is the tester's assessment. Follow your team's definitions and confirm impact and workaround availability. Priority is explicitly left to triage.

## Copying to Jira

1. Prepare the report, inspect the missing-detail questions, and edit its text as needed.
2. Copy report, paste into Jira's description, and set the Jira summary separately.
3. Attach the screenshot or other evidence manually in Jira. The copied text does not upload attachments or create an issue.
4. Download text is available as an alternative. If clipboard permission fails, the report is selected for manual copying.

Changing source fields disables copying/downloading until the report is prepared again, preventing stale exports.

## Local data handling

Bug fields and screenshot previews stay in the current browser tab's application memory. No AI or Jira calls are made, no bug-data POST is sent, and the application does not save these fields to local/session storage. Refreshing clears the draft. Copying and downloading intentionally place a copy outside the app, under your control.

Optional previews accept PNG/JPEG/WebP up to 5 MB. They use a local blob URL, are not analyzed and are not included in report text. Clear all bug details resets the draft and releases the preview URL. Use company data only according to company policy.

## Validation

Native checks verify deterministic report formatting, limits, enum validation, explicit unknowns and preservation of supplied facts. Desktop/mobile browser checks cover local generation, missing expected behavior, stale-copy prevention, edited downloads, privacy after reload, screenshot preview/clearing, accessibility and clipboard success/fallback behavior. Clipboard calls are controlled in tests; OS clipboard behavior depends on browser permissions.

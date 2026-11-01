# Compatibility Matrix

Open **QA Launchpad → Compatibility Matrix**. Track manual testing by environment, build, browser/OS and journey. No integration access or API key is needed. Entering a browser name does not launch that browser or execute a test; record only what you actually observed.

## Workflow

1. Create a matrix scope, such as a feature release or agreed regression scope.
2. Add environment name, build identifier and browser version/OS or device details. Each unique combination is a separate context.
3. Add journeys with confirmed expected behavior. Clarification placeholders are rejected.
4. Execute each agreed combination. Save an observed result and evidence reference for Passed, Failed or Blocked. Not applicable requires an exclusion reason. Unrecorded combinations remain Not run.
5. A saved Failed result can draft a bug with expected/actual facts and environment/build/browser context. Confirm reproduction steps and attach original artifacts manually.
6. Download CSV for the complete planned matrix and JSON for backup/restore. Refresh clears this tab's matrix. Imported manual results are not independently verified.

Adding another build does not populate it with previous results. Definitions cannot be edited in place; create a new scope when requirements change. This keeps changed expected behavior from silently inheriting observations. A new matrix or restored backup requires confirmation before replacing an existing matrix. Returning a recorded result to Not run also asks before clearing it.

## Validation and limits

- Up to 8 environment/build/browser definitions and 8 journeys, for at most 64 planned combinations.
- Duplicate context definitions and journey names are rejected.
- Outcomes require valid environment/journey links; duplicate imported result pairs are rejected.
- Observations are bounded to 2000 characters and evidence references to 1000. Build/name fields and expectations also have explicit limits.
- The JSON backup budget is 256 KB measured as UTF-8, including canonical formatted output. Mutations exceeding this budget roll back. Invalid imports preserve the current matrix.
- Exclusions, blocked results and unexecuted combinations are shown separately. No overall compatibility certification or coverage percentage is inferred.

Keep original evidence under the approved company process. Browser/OS names, timestamps and imported observations are user supplied; schema checks do not authenticate them. This matrix is separate from the versioned QA workspace's defect/retest/release policy. It does not automatically create workspace execution results or release approvals.

## Interview example

Use explicitly synthetic data to demonstrate a failure in build B1 and browser A. Add build B2 and show that its journey starts Not run. Save an actual observation in the correct context, export the complete matrix, and hand a failed result to Bug Builder. Explain why results from one build or browser cannot establish behavior in another.

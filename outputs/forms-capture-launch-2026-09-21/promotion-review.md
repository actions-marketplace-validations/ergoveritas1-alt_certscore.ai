# Forms promotion review — September 21, 2026

## Scope

Presentation and documentation corrections only. No scanner runtime, score, normalized concern, policy, finding, capture budget, permission, or infrastructure change. No new scan, model call, retention, or recurring infrastructure cost.

## Changed files

- `apps/web/components/scans/collection-surfaces-table.tsx`: exact no-fill/no-submit explanation; exact review-label explanation; neutral information icon/color for ordinary personal categories; “Declared destination” heading and configured-action explanation. Existing high-sensitivity and preselected-marketing cues remain separate.
- `apps/web/lib/releases.ts`: conditional verified masked crop wording; declared-action clarification.
- `apps/web/app/guides/website-form-scanning/page.tsx`: conditional screenshots and destination clarification.
- `apps/web/app/how-it-works/page.tsx`: conditional verified masked crops.
- `apps/web/app/developers/mcp/page.tsx` and `apps/web/app/developers/reference/page.tsx`: conditional screenshots and declared-action explanation.
- `apps/web/components/scans/collection-surfaces-table.test.tsx`: neutral ordinary categories, exact copy, and visible retained/omitted-count regressions.
- `apps/web/lib/releases.test.ts`: qualified crop and destination language assertions.
- `packages/certscore-scan-core/src/collection-surface-passive.test.ts` (new): real local runtime lane with interaction/value-set/submission-request tripwires; small and 251-candidate pages; unchanged values and explicit 250-candidate limitation.
- `packages/certscore-scan-core/src/collection-surface-inventory.test.ts`: isolated 10-form, 20-field/form and 60-field/page retention limits with candidate counts, truncation flags and coverage reasons.
- `packages/certscore-scan-core/src/collection-surface-snapshots.test.ts`: pixel-mask checks for pre-populated password, email, ordinary input, textarea, select and contenteditable controls.
- `apps/web/lib/api-v2/report-evidence-page.test.ts`: complete reconstruction retains form inventory and available/unavailable/withheld snapshot states/reasons.
- `packages/certscore-mcp/src/server.test.ts`: both full/OAuth and Light MCP preserve API form records and all snapshot states while forwarding cursors.

## Validation and limitations

- Focused scanner suite: 20 passed initially; the new direct masking test exposed a test-only tsx named-function shim prerequisite. After mirroring the production wrapper's shim in the test, the masking test passed. No production capture fix was needed.
- Focused web/API/report/release suites: 28 unique cases passed (27 initially, then the 10-case form-table suite passed after adding the truncation-display assertion).
- Focused full/Light MCP round-trip: 1 passed.
- Scanner typecheck passed. `pnpm preflight:fast` passed (exit 0): 1,856 tests across its selected suites, with web, scanner and Lambda typechecks. The final additional form-table truncation assertion passed in the focused 10-test table run.
- Existing snapshot regressions confirm unsafe review -> withheld/no bytes; thrown review, timeout, cancellation, layout drift and document mismatch -> unavailable/no bytes. Existing report/API tests preserve unavailable states and reject unsafe URLs/malformed retained image references. Existing full-site export tests preserve inventory and statuses with scoped image URLs.
- The local browser renders the revised guide successfully.
- The no-interaction tests exercise the production runtime evidence lane and crop capture, not every possible arbitrary site script or every scanner configuration. Sites can autonomously submit/send data without scanner input. Separate authorized consent actions remain governed by their existing guards.
- Pixel tests establish masking for the supported control rectangles, not guaranteed redaction of all sensitive prose, canvas, shadow DOM or arbitrary page content. The production classifier in `apps/v2-dag-lambda/src/screenshot-safety.ts` checks typed sexual/sexual-minors moderation flags; it is not a general personal-data detector. Failed/malformed classification throws and capture withholds bytes. Deterministic tests cannot establish perfect model accuracy or universal privacy redaction.
- Report/API/MCP consistency is verified at the shared projection/pagination/export and MCP transport boundaries. Existing retained production evidence can be read for publication verification; no new production scan is needed.

## Publication acceptance

- PR [193](https://github.com/ergoveritas1-alt/certscore.ai/pull/193) merged; tested source `581647e01104d7382daae404f515aa1beb5f503e`, identical-tree deployed merge `d7ca388dbbe72b29b00d958d211d3b1d6037e98a`.
- [AWS web deployment](https://github.com/ergoveritas1-alt/certscore.ai/actions/runs/35625691992) succeeded. ECS task definition 644, rollout COMPLETED, two running tasks. Scanner/MCP runtimes were not deployed.
- All PR checks passed. The pre-existing MCP preview-window timing test failed once in CI (20 ms window), then passed on unchanged retry. The full 141-test MCP package suite also passed locally. No unrelated runtime or test behavior was modified to accommodate this.
- Seven canonical no-query URLs passed both public-edge and independent direct AWS-origin checks: release, guide, MCP docs, API reference, how-it-works, retained public report and version. HTML main-content hashes match after decoding Cloudflare's email obfuscation; receipts and cache headers are in promotion-verification.json.
- Existing public report inventory, field records, coverage, snapshot status, findings and score exactly match the retained pre-change API export. Screenshot SHA-256 remains `3232d623794303f93b84ce0e0444c8d73bd0c0581c97c73f054b3a2e28842122`. No new production scan or record was created.
- Production browser confirms the requested copy and neutral information styling for Identity/profile, Personal contact and Unrestricted free text. Mobile viewport/scrollWidth 390/390; snapshot dialog 358 px; correct image loads at ~324 px from its 610 px source. Viewport override restored afterward.
- Production correction is verified. No scoring/finding changes or remaining blocker for these scoped corrections. General personal-data detection beyond supported control masking remains outside the verified behavior, as described above.

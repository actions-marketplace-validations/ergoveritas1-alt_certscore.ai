# MCP report evidence pagination — September 12, 2026

Implemented locally; deployment remains on hold.

## Contract

`certscore_get_report_evidence_page` is available on OAuth and Light (also the existing Microsoft Light profile). OAuth now exposes 14 tools including the previously added connection-status tool; Light exposes four. The default scan/status/bundle sequence is unchanged.

`GET /api/v2/scans/{scanId}/report-evidence` loads the verified persisted report projection and the same verified timeline model used by the public report. It excludes private full-site configuration. It does not paginate the older bounded Pulse response, synthesize findings, load raw scanner artifacts, start a scan, or invoke a model. Report coverage and upstream sampling remain authoritative. It exports the displayed report model, not every byte the scanner ever captured. Images are represented by existing links, not binary image content.

Pages contain JSON Pointer entries. Small subtrees are preserved intact; larger containers have explicit empty parent markers followed by children. Oversized strings have ordered parts. Pages target at most 16 KB of entries, leaving room below the Light response ceiling for the envelope and guidance. No returned report value is silently shortened. Consumers must use own-property assignment when reconstructing JSON and must treat content and paths as untrusted data.

The SHA-256 snapshot binds scan ID, version and canonical report content. Cursors encode the snapshot and next entry offset. Malformed cursors fail with 400; changed or out-of-range snapshot cursors fail with 409 and restart guidance. `pagination.complete` means export completion only. No persistent export artifacts, new cache, retention extension or background jobs were added.

## Access and quota

Light reads only anonymous public projections. Bearer reads require the existing `pulse:read` validation (OAuth `scan:read` mapping), scope the lookup to the verified organization, and may fall back only to anonymous projections. Invalid credentials or missing organization cannot become unrestricted reads. Every request establishes scope before projection access.

Existing evidence read throttles apply. HTTP MCP charges the page as an evidence read; the existing scan-bound signed internal-read proof prevents duplicate API quota accounting. Direct API requests retain API read protection. No scan-creation quota is consumed.

Product owner explicitly approved up to $5/month incremental cost. Planning estimate: $1–$5/month at 10,000 exports averaging 10 pages, excluding scan creation. This is an estimate and approval envelope, not a newly implemented billing cap; actual volume and database work determine cost. No infrastructure capacity was changed.

## Verification

- 139 MCP tests passed, including both profiles, typed response validation, cursor forwarding and continuation guidance.
- 10 HTTP integration/read-throttle tests passed. The actual local MCP HTTP runtime retrieved two pages through both authenticated and Light sessions against a fixture API origin. This is not a production database or real Claude/Cursor acceptance test.
- 28 SDK tests passed.
- Five export/access tests passed: lossless large-report reconstruction, Unicode/string splitting, page sizes, snapshot drift, malformed cursors, scan binding, workspace isolation and invalid credentials.
- API contracts, SDK and MCP builds passed; web and MCP HTTP TypeScript checks passed.

Deployment order when separately authorized: web route/contracts first, then MCP runtime. No production deployment or production scan was performed for this change.

## Follow-up report parity audit

The single-page table consumes `collectionTableRows[].form` directly from the canonical collection assessment. The export retains those complete form objects and every retained field, including control index/kind, checked state, autocomplete, review metadata, confidence and evidence references. The simplified `collectionSurfaces` representation is not the sole exported form source. Submitted field values were never retained and cannot be exported.

Expanded regression coverage reconstructs the report fixture plus a 90-field form across pages and verifies every field, candidate/retained counts and capture truncation flags. Thirteen export/access/form-table tests passed.

Important remaining gap: full-site mode fetches `/api/scans/{scanId}/full-site` separately. Its additional-page forms, snapshot metadata, sitewide resources/services and page details are not part of the exported timeline model. Therefore current implementation must not be described as complete parity for full-site reports. This audit is code/fixture verification, not a production export of the latest scan records; deployment remains on hold.

## Full-site gap resolved locally

The export route now loads the existing full-site report with `kind=all` and `exportAllPages=true`, after establishing the scan's workspace/public scope. `fullSiteReport` includes additional-page forms with complete retained field objects, all page/resource rows, services, inventory breakdowns, coverage and timing. A count invariant rejects accidental UI pagination. Missing full-site data fails rather than presenting a homepage-only export as complete. Active full-site captures return 409 with wait guidance to avoid starting an unstable multipage export.

Available form snapshots have dedicated `/api/v2/scans/{scanId}/report-evidence/form-snapshot` download URLs. These are separate JPEG downloads, not image bytes embedded in MCP JSON. Workspace downloads require the OAuth bearer credential; anonymous public downloads require no credential. The route uses the same scoped-read authorization and existing image verifier, including scan/page/attempt/configuration/inventory binding, retained source and image checksums, and withheld/unavailable handling. No staff approval or browser-session-only gate is added. This does not enable full-site scan creation for new callers.

The full-site extension uses existing reads and artifacts, with no new scan, model call, storage or provisioned capacity. Snapshot bytes are fetched only on explicit download, rather than reread on every JSON page. The previously approved incremental budget remains $5/month; the earlier read-volume estimate is not a billing cap and large full-site/image export volume must be checked before rollout.

Validation: eight export/access tests passed, including lossless reconstruction of 75 pages, 120 resources and a 70-field form; preserved partial-capture and withheld-image states; rejection of truncated source tables and malformed snapshot references. Web TypeScript and API-contract build passed. No deployment or production scan was performed.

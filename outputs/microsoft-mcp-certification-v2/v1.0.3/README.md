# Microsoft concierge handoff - ticket 5790539

Prepared September 18, 2026. Package version 1.0.3. This folder is a review handoff, not a claim of publication readiness or Microsoft approval.

## Files to use

- certscore-microsoft-mcp-package-v1.0.3.zip: app package for the concierge team.
- partner-center-listing.md: matching title and descriptions to paste into the draft listing when directed.
- partner-center-icon-300.png: matching listing icon. The package contains its 192px color and 32px outline counterparts.
- certification-notes.md: precise authentication model and functional test instructions.
- vscode-validation.mcp.json: optional diagnostic configuration; prompts for a short-lived application token.
- release-notes.md: package changes and brief product description.
- reviewer-reply-draft.md: truthful reply for the existing email thread; not sent.
- copilot-demo-plan.md: exact capture sequence and captions for genuine Copilot Studio assets.
- verification.json: local package/schema/link verification results, generated separately.

## Issue disposition

| Issue | Prepared change / remaining requirement |
|---|---|
| 1 - Authentication | App-only flow documented; diagnostic config supplied. Microsoft grant-type confirmation and authenticated end-to-end validation remain open. No authentication policy or production deployment changed. |
| 2 - Names | Package names unified. Matching Partner Center text prepared; portal not updated. |
| 3 - Icons | Both package icons derive from the same canonical symbol. Matching listing icon prepared; portal replacement and reviewer acceptance pending. |
| 4 - Microsoft in name | Removed from package names. |
| 5 - Website | Manifest now points to homepage. |
| 6 - Dependencies | Copilot Studio/environment access, publisher-managed authentication, no separate CertScore signup, public-only scope, and usage limits described. Portal copy and customer connection confirmation pending. |
| 7 - Screenshots | Real Copilot Studio capture still required; existing website-only images not relabeled. |
| 8 - Video | Real Copilot Studio recording still required, or reviewer agreement to remove optional video. |
| 9 - Help links | Explicit get-started/help, usage documentation, contact, website, privacy, and terms links included. Portal copy pending. |
| 10 - Captions | Captions supplied in capture plan; final screenshots still required. |
| 11 - Attestation | Historical worksheet exists in outputs/microsoft-attestation-corrected-20260823. Must revalidate name, product scope, data handling, retention, subprocessors, and operational assertions before portal attestation. Completion not claimed. |

## Schema assumption

Retain devPreview / vDevPreview under Microsoft's explicit September 20 allowance. Recheck with the reviewer if submission/review occurs after that cutoff. Keep the app UUID and connector ID unchanged so this remains the same offer.

## Validation performed

The MCP build and all three Microsoft Entra authentication regression tests passed. The archive passed official live vDevPreview schema validation, ZIP integrity and byte-parity checks, naming/listing parity, icon dimensions/pixels, public-link checks, endpoint health, and public Light four-tool schema parity. The Microsoft endpoint correctly rejected an unauthenticated request. See verification.json for the timestamp, archive hash, and precise limitations. These checks do not establish an authenticated Copilot Studio connection.

Rebuild from the repository root with the verified vault configuration:

```sh
CERTSCORE_MICROSOFT_KEY_VAULT_URI=https://cs-msft-mcp-kv-7150890.vault.azure.net/ pnpm exec tsx scripts/build-microsoft-mcp-certification-package.ts
```

The separate verifier is scripts/verify-microsoft-mcp-certification-package.ts. It requires ajv-draft-04 and ajv-formats; CERTSCORE_SCHEMA_MODULES can point to a temporary npm installation prefix so validation does not change repository dependencies.

## Current blockers

Copilot Studio redirects to Microsoft sign-in; no authenticated Copilot Studio environment was available in this session. The current endpoint is app-only, while the reviewer attempted interactive OAuth. Do not report the auth blocker, customer connection, screenshots, or video as passed based on local package validation.

## Submission sequence

Send the prepared clarification/remediation reply through the existing thread if desired this morning. Complete the real authenticated workflow and demo captures. Apply the prepared listing assets and text as directed. Resubmit in Partner Center only after the concierge team's final approval; clarify their conflicting boilerplate about republishing test notes before acting on it.

No production runtime change or recurring infrastructure cost increase is introduced by this package and documentation update.

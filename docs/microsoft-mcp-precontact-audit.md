# Microsoft MCP pre-contact audit — September 18, 2026

Product decision: preserve the free, usage-limited four-tool public/light offer,
without a separate CertScore account. No publication or email is authorized by
this audit. Microsoft ticket #5790539 remains the authoritative review thread.

## All 11 findings

| # | Finding | Evidence and current disposition |
| --- | --- | --- |
| 1 | Authentication blocks validation | Open. Tenant-restricted Copilot OAuth successfully exercised four tools and a fresh scan. General reviewer/customer authentication and live refresh after expiry remain unverified. Standard `/mcp` VS Code DCR/sign-in succeeded but is a different 14-tool workspace product. Ask Microsoft to confirm the catalog flow; do not substitute endpoints. |
| 2 | Name mismatch | Local manifest and prepared listing use `CertScore Web Privacy Scanner`. Partner Center title and all live first-run/listing surfaces still require verification/update. Not closed globally. |
| 3 | Icon mismatch | Local package has 192×192 color and 32×32 white/transparent outline icons; a 300px listing icon is prepared. Prior automated pixel checks passed. Visual symbol consistency and actual Partner Center replacement must be confirmed. |
| 4 | Microsoft in full name | Fixed in local manifest: short/full/connector names match and omit Microsoft. Await reviewer acceptance. |
| 5 | Website redirects to contact | Local manifest points to `https://certscore.ai/`; prior same-path HTTP 200 check passed. Fresh package verification rerun separately. |
| 6 | Missing dependencies | Local description states Microsoft access/admin prerequisites, free usage limits and no separate CertScore account. Final auth wording depends on Microsoft's decision; Partner Center parity remains pending. |
| 7 | Nonfunctional screenshots | Open. Real Copilot results exist, but final approved-flow screenshots with matching identity/icon are not yet supplied. A plan is not an image deliverable. |
| 8 | Video not in Copilot | Open. Real OAuth end-to-end evidence exists; final Copilot recording not yet produced/uploaded. Tenant-local pilot must be labelled as such. |
| 9 | Missing onboarding/help/contact links | Fixed in local description and prepared listing. Actual Partner Center update remains pending. No signup link is needed to imply a CertScore account requirement for this chosen offer. |
| 10 | Screenshot captions | Open. Capture plan calls for embedded captions; final captioned genuine screenshots still needed. |
| 11 | Publisher Attestation | Open/unverified. Requires truthful owner-reviewed security/privacy responses; do not infer completion or submit attestations from code alone. |

## Verification boundary

Fresh package verification passed at 09:45:07 UTC: ZIP/source equality, draft-04
Microsoft devPreview schema, prepared listing/manifest parity, icon pixel checks,
all six public URLs returning same-path HTTP 200, service health, unauthenticated
Microsoft endpoint returning 401, and exact public-Light tool/schema parity.
Archive SHA-256 remains
`48fdb24f9d07f781ca59c242e1dd766c95ebe3e0ea9b440ed0163dfd6778d7bd`.
This does not verify the live Partner Center listing or authenticated app-only
connection. The verifier initially lacked its optional schema dependency in the
repo; rerunning with the existing isolated schema-validator installation passed.

On this audit run, the local environment/authentication/HTTP integration test
command passed seven test cases, including application-only validation,
delegated validation, malformed claims and refreshed-token identity binding.
These are local regression tests, not a live AzureKeyVault app-only retest or
proof that Copilot obtained a new token after expiry.

At 09:44 UTC the pilot connection was only approximately 35 minutes old. Its
original token expiry was not inspected, so a further successful call now could
not honestly establish expiry/refresh. Do not extract bearer credentials merely
to inspect expiry. A later call must be correlated with safe token-issuance or
refresh evidence before marking this test passed.

Certification notes were corrected to acknowledge the deployed delegated pilot;
their prior assertion that delegated tokens were never accepted was stale.
The package archive, endpoint, authorization configuration and product scope
were not changed by that correction.

## Remaining work before final remediation submission

1. Send the narrow authentication clarification when the owner authorizes sending.
2. Verify live refresh and app-only authentication using an approved secure test
   path, without placing tokens or client secrets in logs, notes or email.
3. Obtain Microsoft's supported customer/reviewer flow before recording final
   onboarding footage or changing the manifest authorization.
4. Produce real screenshots/video, verify icon/name consistency, and apply the
   approved listing changes without republishing prematurely.
5. Prepare Publisher Attestation responses for owner review.
6. Resolve the devPreview allowance with Microsoft if review extends beyond
   September 20; do not invent a numbered manifest version.

No new scan, infrastructure capacity, quota or recurring-cost change was made
for this audit. Nothing was emailed or republished.

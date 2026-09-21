# Forms capture claim ledger — 2026-09-21

Verification date: September 21, 2026 (UTC). Initial serving web revision:
`08d9cc7b9341457d7dae0f1cdbc7b94ec06ec759`. Scanner revision verified in the
retained runtime artifact: `c02affa98251a1b58f47c339f2d33862e9b6a92a`.
All three production Lambda regions reported Active and the same resolved image
digest `sha256:c7586a2e2d11fc3d13d8b6e8b5ddae3d084628652df60bafd575cc15256909bb`.
Final serving web revision: `4644dbe1a53b156beef66c1a410d0fe46b78094b`.
Live retrieval evidence is recorded in verification.md and network-verification.json.

The source paths below are relative to WC01 at the initial serving web revision,
except scanner paths, which were checked against the serving scanner revision.
No diff exists between those revisions for the inventory/snapshot modules.

| Material claim / final wording | Source and evidence | Mode / limitation | Disposition |
| --- | --- | --- | --- |
| “Find observed forms and fields” | `packages/certscore-scan-core/src/collection-surface-inventory.ts`; `packages/certscore-contracts/src/index.ts`; live scan `63b87ff5-07c5-4c7b-895a-028ea6bb43c9`, `collectionTableRows[0]` | Main document; native/ARIA form groups and eligible standalone controls. 10 forms, 20 fields/form, 60 fields/page, 250 inspected controls. Hidden/iframe/interaction-only controls excluded. | Approved, bounded wording |
| “Review labels, field types, required states, checkbox or toggle states and evidence references” | Same inventory module; `packages/certscore-contracts/src/collection-field-review.ts`; live four-field contact fixture | Retained metadata only. Categories are review routing, not legal classifications. Generic opt-in label remained unknown, not marketing. | Approved |
| “Open available form screenshots” | `collection-surface-snapshots.ts`, `masked-form-screenshot.ts`; live image `3232d623…8842122`; provenance-verification.json | Form/shared-container crops, not whole-page screenshots. JPEG ≤640×960, ≤96 KiB, optional 2.5-second combined budget. Image can be absent/withheld. | Approved, availability qualified |
| “Input values are masked” | `masked-form-screenshot.ts`; pixel-masking regression tests; visual inspection of live masked crop | Values masked before review; no assertion of universal redaction of all page text. Test fixture contains no real visitor data. | Approved |
| “A missing image is a coverage limitation, not a privacy finding” | `form-snapshot-status.ts`; collection snapshot tests; `normalized-concerns.ts` and `concern-policy.ts` | Image failure does not erase structured fields or create a finding. Missing inventories are unknown. | Approved |
| “Single-page and full-site reports” | `pre-consent-runtime-scanner.ts`; `apps/web/server/scans/full-site-report.ts`, `full-site-forms.ts`; full-site export/access fixtures | Single-page live example verified. Additional-page full-site mapping verified in serving implementation and deterministic tests, not a new full-site live crawl. Existing permissions/crawl limits apply. | Approved; no universal crawl claim |
| “Field-review indicators…do not by themselves change a score” | `collection-field-review.ts`, `collection-surfaces-table.tsx`; live form has review cues and zero findings | A form or selected control alone does not establish unlawful collection, consent validity, or a scoring effect. | Approved |
| “Separately supported findings can highlight…sensitive-surface context alongside…tracking or session-replay evidence” | `normalized-concerns.ts` sensitive collection mapping; `concern-policy.ts`; `finding-atlas.ts`; 141 boundary/component tests | Existing canonical concern/policy/findings flow. Co-occurrence does not prove actual field-value capture. The featured contact fixture has no such finding. | Approved, explicitly separate from example |
| “Does not fill or submit forms” | `collection-surface-inventory.ts`; `form-destination-trace.ts`; `docs/certscore-v2/form-destination-tracing.md` | Passive form observation; separate consent-control actions do not authorize form submission. Declared actions are not tested destinations. | Approved |
| “Copy the forms table as JSON” | `collection-surfaces-table.tsx` CopyJsonButton | Retained report rows; submitted values not retained. | Approved |
| “API v2…MCP…retained form details, coverage and snapshot links” | `report-evidence/route.ts`, `report-display-export.ts`, `full-site-evidence-export.ts`; live HTTP download and `certscore_get_report_evidence_page` on owned fixture | JSON pointers must be resolved. Images separate. Single-page links use report image route; full-site links use scoped API v2 image route. Workspace/public access preserved. No claim every agent can fetch every image. | Approved |
| PDF availability | `apps/web/server/scans/report-export-pdf.ts` dataCollectionSurfaces appendix | Textual form/field metadata and coverage; not interactive screenshot parity. No PDF launch promise. | Narrowed to documentation |
| “Began rolling out earlier in September” | Initial snapshot implementation `19a1617c` (Sep 7); field review `002c1c16` (Sep 13); capture reliability commits through `09df2100`; serving scanner c02affa | September 21 is announcement/publication date, not first activation. | Approved |
| Real example: four fields, required email, unchecked opt-in, no findings | Production scan `63b87ff5-07c5-4c7b-895a-028ea6bb43c9`, EU-Ireland; captured 2026-09-21T14:05:01.324Z; verified bundle/inventory/image hashes | Owned static test page. No real visitor data. Screenshot masks checkbox; unchecked state is from structured inventory. | Approved |
| “Every form”, protected pages, submits forms, legal compliance, evidence of actual visitor data sent, automatic notice adequacy verdict, every form risky | Unsupported or contrary to implementation | Excluded from article, docs and social copy | Rejected |

All material claims resolved. No pending marketing claim is authorized for publication.

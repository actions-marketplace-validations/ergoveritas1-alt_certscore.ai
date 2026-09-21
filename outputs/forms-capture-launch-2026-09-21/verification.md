# Forms capture release verification

## Production feature acceptance, September 21, 2026

- Read-only AWS inspection confirmed web `08d9cc7b9341457d7dae0f1cdbc7b94ec06ec759`, ECS/Fargate.
- All three approved scanner regions use image digest `sha256:c7586a2e2d11fc3d13d8b6e8b5ddae3d084628652df60bafd575cc15256909bb`; retained artifact identifies source `c02affa98251a1b58f47c339f2d33862e9b6a92a`.
- Reused existing production reports first. Historical sample `f4362840-376e-4d8c-897a-34a220136ad4` provided empty-state verification; recent owned sentinel exports had no forms. Private results were not made public or used as marketing evidence.
- Registry validation passed; central contact-history export succeeded. Canonical selector used a task-scoped owned-only manifest. Explicit owner authorization for one owned-fixture verification supported a recorded cooldown override; no rotating third-party sample was contacted. The generated owned outcome/ledger candidate is retained with a stable scan-based idempotency key. Production MCP creation records its own central contact.
- One fresh production scan: https://certscore.ai/scan/63b87ff5-07c5-4c7b-895a-028ea6bb43c9 . Exact target https://ergoveritas.com/form-inventory-01/ . No form interaction. Completed at 14:05:11 UTC.
- One Contact enquiry form, four fields; Email required; opt-in unchecked; no field truncation; no form limitation keys; zero privacy findings.
- Source bundle, inventory and served JPEG hashes all verified. See provenance-verification.json. Form/image reference and exact page match. JPEG 610×421, 12,313 bytes. Visually reviewed: masked controls, no visitor values. Public article image is an unchanged copy of this safe owned-fixture crop.
- Live browser: expanded form details expose labels, states and evidence refs; View form opens matching image; loading resolves successfully. Mobile 390×844: document scrollWidth 390, dialog x=16/width=358, image width≈324; no viewport overflow. Desktop 1440×1000 checked. Internal table scroll preserves wide field data.
- API report-evidence download and hosted MCP Light report-evidence retrieval succeeded against the same scan; retained four-field records and snapshot link verified. Snapshot response JPEG with private/no-store. Export does not contain image bytes. Full-site additional-page behavior is serving-code and fixture verification, not a fresh production crawl.
- Failure/withheld/binding/budget/partial-inventory states verified with deterministic regression tests. Existing public empty report checked in browser. No fake production failure record created.

## Validation

- 31 focused inventory, snapshot, field-review, form-table and API-export tests passed.
- 141 normalized-concern, concern-policy, destination-projection and collection-section tests passed.
- Final change-aware public-web preflight passed (exit 0), including web typecheck and 1,347 tests across required suites. All 10 release/discovery/metadata tests passed separately.
- No finding, scoring, scanner runtime, permission or infrastructure behavior changed.

## Costs

One-time owned scan plus bounded ECS read-only diagnostics estimated below $0.10 total (not a measured bill). No new recurring infrastructure, scans, model calls or retention. Added static article/image transfer and storage estimated below $0.10/month at 1,000 release-page views, pre-approved below-$1 threshold; scale-dependent rather than a hard cap.

## Publication acceptance

**READY FOR SOCIAL ANNOUNCEMENT. No publication blocker remains.**

- Release: https://certscore.ai/releases/forms-capture ; guide: https://certscore.ai/guides/website-form-scanning . Product explanation, API/MCP forms documentation, homepage/release cards, adjacent navigation, RSS, sitemap, llms files and metadata updated.
- PR https://github.com/ergoveritas1-alt/certscore.ai/pull/192 merged. Tested source `169ca80d51c3d4e2d30ae163c52d2acd338dd068`; deployed merge `4644dbe1a53b156beef66c1a410d0fe46b78094b` has the identical tree. Clean main checkout deployed through the repository AWS workflow, web only; no scanner deployment.
- AWS workflow https://github.com/ergoveritas1-alt/certscore.ai/actions/runs/35610370981 completed successfully. ECS task definition `certscore-web-certscore:643`, rollout COMPLETED, desired/running 2/2 and no previous deployment remaining.
- Both public Cloudflare edge and independent direct AWS ALB (preserving canonical hostname TLS/SNI) returned 200 for all 15 canonical URLs without cache-busting parameters. Both `/api/version` responses identify deployed revision `4644dbe1a53b156beef66c1a410d0fe46b78094b` and `ecs-fargate`.
- `network-verification.json` retains retrieval timestamps, raw response SHA-256, selected cache headers, serving revisions, content assertions and comparison results. XOR-decoding Cloudflare email hrefs and email-wrapped text makes every HTML main-content hash identical. Feed, sitemap, llms files and both image assets are byte-identical. API version timestamps naturally differ. No stale content was observed on either path.
- Release canonical URL, Open Graph article/image/1200×630 dimensions and X summary_large_image metadata passed. Live browser confirms the actual 610-pixel source image loads; mobile article viewport and scrollWidth both 390, displayed image width 308.
- Post-deploy public feature report still shows 1 form/4 fields, zero priority issues and the correct Contact enquiry modal. Its actual snapshot endpoint loads the matching 610-pixel JPEG successfully.
- Independent AI web-fetch tool returned “not accessible via this tool” for both new pages on two attempts. This is a retrieval-tool limitation, not evidence of stale content; public HTTP, direct origin and browser checks independently passed.
- Final evidence-only commit records acceptance and does not change the deployed application tree. Social copy is ready in social-copy.md; no posts were published or scheduled, and no external messages or promotion were sent.

Local final release rendered at desktop and mobile widths. Mobile article width/scrollWidth both 390; real figure fits at 308 px and loads successfully. 1200×630 social card visually reviewed. X standalone 229/280; optional thread 207/219/226 characters, URLs counted as 23.

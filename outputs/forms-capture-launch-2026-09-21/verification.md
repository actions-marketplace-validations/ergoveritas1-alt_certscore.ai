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

Pending final preflight, clean committed AWS web deployment and post-deploy network verification.

Local final release rendered at desktop and mobile widths. Mobile article width/scrollWidth both 390; real figure fits at 308 px and loads successfully. 1200×630 social card visually reviewed. X standalone 229/280; optional thread 207/219/226 characters, URLs counted as 23.

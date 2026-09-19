# Production hidden-link audit

Window: 2026-09-17T07:05:08.330805+00:00 through 2026-09-19T07:05:08.330805+00:00 (UTC), equivalent to September 17, 09:05 through September 19, 09:05 CEST. Selected by scan creation time. Includes all internal, QA, canary, customer and bot traffic.

978 scans: 976 completed and 2 failed. Read all 976 available canonical evidence bundles and verified original SHA-256 hashes. No new scans, destination visits, report rewrites or production changes.

## Detections

Nine starting-page scans contained 45 retained concealed-link occurrences. Eight have matching persisted site-integrity projections (43 occurrences); Clio has two retained observations without a persisted site-integrity projection. Its persisted scan-no-go assessment records a CAPTCHA/security challenge and a 403 terminal main document, so those observations are not treated as reportable findings. Nine additional pages of Pferdeklinik Röntorf each contained eight occurrences, adding 72 verified occurrences. Total observed: 117 across 18 page captures within nine parent scans/sites. These count individual page/link occurrences, not distinct destination domains. Of these, 115 have a matching persisted starting-page projection or pass the canonical additional-page projector.

| Site | Starting-page occurrences | Additional-page occurrences | Destination domains |
|---|---:|---:|---|
| www.pferdeklinik-roentorf.de | 8 | 72 | salzburgapotheke.com, innsbruckapotheke.com, linzapotheke.com, mobileporn.cam |
| www.ultimedia.com | 1 | 0 | policies.google.com |
| fpf.org | 3 | 0 | www.youtube.com, www.linkedin.com, www.instagram.com |
| krafton.com | 4 | 0 | www.youtube.com, www.instagram.com, www.facebook.com, www.linkedin.com |
| www.anses.fr | 10 | 0 | tarteaucitron.io, www.atinternet.com, piano.io, www.facebook.com, support.twitter.com, policies.google.com |
| www.bancomundial.org | 4 | 0 | academy.worldbank.org, scorecard.worldbank.org, projects.worldbank.org |
| www.inail.it | 12 | 0 | cookiepedia.co.uk |
| www.clio.com | 2 (observation only) | 0 | cliocon.com |
| www.bruker.com | 1 | 0 | cookiepedia.co.uk |

## Coverage and limits

- 691 starting-page bundles contain typed observations: 674 not truncated and 17 truncated.
- 285 bundles lack the observation; 2 failed scans have no canonical artifact. These 287 are not negative hidden-link results.
- Three zero-detection observations failed document/interval binding checks and also cannot support a verified negative result. IDs are in audit.json.
- 580 scans have schema-valid persisted site-integrity projections, all matching retained observation content.
- Of 170 additional-page records, 18 completed: 9 have verified hidden-link evidence and 9 lack it. The other 152 were excluded (100) or cancelled (52), so were not scanned.
- INAIL hit the 12-link retention cap: its count is a lower bound.
- Detection establishes retained concealment observations, not compromise, maliciousness or unrelated content. Several destinations are consent/policy/social links or related brands and need contextual review.
- This is a historical evidence audit, not a fresh inspection of live pages. Missing evidence is not repaired or inferred.

## Verification and cost

All retained observation and persisted projection schemas passed. All nine positive starting-page observations passed the document token and capture-interval checks. Additional-page positives passed the repository canonical projector after original-byte hash and configuration checks.

Read approximately 728 MB of starting-page bundles, plus 18 additional-page artifacts and bounded database results. Estimated one-time AWS audit cost: below $1. No recurring cost change.

## Scan references

- https://www.pferdeklinik-roentorf.de/: 3fdfcf5e-f8b3-4f7b-b5f2-38199ae4e70a; captured 2026-09-17T22:24:43.322Z.
- https://www.ultimedia.com/: 43efde02-5081-43ce-ab4e-b02b09b78852; captured 2026-09-18T01:31:11.595Z.
- https://fpf.org/: e4a7ed5b-a247-408a-a6d3-68f96d19b598; captured 2026-09-18T02:34:58.880Z.
- https://krafton.com/: 3ffc5bb3-4662-44a8-b2d0-e422a85b7abc; captured 2026-09-18T05:11:53.554Z.
- https://www.anses.fr/fr: 8e95e6f1-994e-4307-a95f-db6d23e73911; captured 2026-09-18T10:07:42.652Z.
- https://www.bancomundial.org/ext/es/home: 5b0656c5-bf7b-4ff5-99db-b372cb0588f0; captured 2026-09-18T16:53:45.612Z.
- https://www.inail.it/portale/it.html: 49a8d781-a4fc-455b-a670-72060a6d232a; captured 2026-09-18T21:33:14.985Z.
- https://www.clio.com/: e781ccb8-cb4f-4001-9bd8-b1dede681396; captured 2026-09-18T21:29:47.060Z.
- https://www.bruker.com/en.html: 92849224-aa6a-4fe6-bfbf-1b6af504da71; captured 2026-09-19T02:01:50.676Z.

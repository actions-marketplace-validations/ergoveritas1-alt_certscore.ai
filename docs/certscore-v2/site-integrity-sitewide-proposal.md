> Historical rollout proposal. The later owner-approved v3 hidden-link scoring policy supersedes score-neutral statements below; see [current policy](./site-integrity-policy.md).

# Hidden outbound links across scanned pages

Status: implementation approved by the product owner on September 17, 2026, including the $6–10/month incremental estimate at 100,000 ten-page scans/month.

## Scope and behaviour

Capture hidden outbound links on the main document of every successfully scanned page, including the starting page. Coverage follows the existing crawl limits and exclusions; it must not imply every discovered page was inspected. Additional-page scans currently disable this capture through the `inventory_only` execution profile.

Reuse the existing passive consolidated snapshot and existing recovery allowance. Preserve the current limits: 1,000 inspected anchors, six ancestors, 20 milliseconds per capture and 12 retained links per page. Add no navigation, browser session, invocation, model call, destination visit, retry or timeout extension. Retain source page, domain, concealment method and provenance; continue excluding destination paths, queries and link text.

Version the observation/projection contract to distinguish additional-page main documents while preserving historical v1 records. Bind each additional-page observation to its parent scan, page job, attempt, final document URL, runtime document token, capture interval and verified original artifact hash. Retain it in the existing additional-page artifact. Failed, missing, truncated or unverifiable captures must remain explicitly limited rather than establishing absence.

After artifact verification, apply normalized concern construction, concern policy and unified finding projection per page. Preserve the existing per-page eligibility threshold (three retained links, two domains and two concealment methods). Do not combine individually insufficient observations to manufacture an eligible finding.

Group eligible projected findings into one Hidden outbound links priority issue with the affected-page count and page list. Detailed evidence shows each source page and its retained links, with capture limitations. Keep the finding score-neutral and outside regulatory gap counts. JSON/PDF exports preserve the same scope and evidence. Existing reports remain starting-page-only; a fresh scan is necessary to obtain the additional-page evidence.

## Implementation boundaries and verification

- Scan core: enable the bounded observer during additional-page inventory capture and carry its typed result through the existing inventory packet.
- Retained artifacts: verify original bytes and page-attempt/document provenance before projecting observations.
- Concern and report layers: consume verified per-page projections through the existing canonical pipeline, aggregate already-eligible findings, and expose affected pages and coverage consistently.
- Regression checks: browser fixture capture on an additional page; contract compatibility; rejection of mismatched hashes, attempts, documents and times; failed-page coverage; independent per-page eligibility; aggregation/deduplication; score neutrality; report and export scope.

## Incremental cost estimate

Planning scenario: 100,000 full-site scans/month, ten pages each, or 900,000 additional pages/month. This is a scale assumption, not a statement of current traffic or measured billing.

At the configured 3,008 MiB Lambda memory and a conservative allowance of two 20 ms captures per additional page, added compute is approximately 105,750 GB-seconds/month, or $1.76 using $0.0000166667/GB-second. Allowing approximately 8 KB per observation across eight existing serialized copies adds about 57.6 GB/month; at three months retention and $0.023/GB-month, storage is approximately $3.97/month. The eight-copy allowance and retention follow the existing starting-page policy's conservative planning assumptions, not measured additional-page artifact sizes.

Estimated total is approximately $6/month, with a proposed $10/month planning allowance for regional pricing and serialization/verification overhead at this volume. Costs scale with additional pages, evidence size and retention; this is not an enforced billing cap. No extra storage operations or provisioned capacity are planned. Validate actual artifact sizes and capture timings during implementation, and revisit approval if the estimate exceeds the allowance.

Pricing references: [AWS Lambda](https://aws.amazon.com/lambda/pricing/), [AWS S3](https://aws.amazon.com/s3/pricing/), and [AWS S3 Standard cost example](https://docs.aws.amazon.com/pdfs/solutions/latest/live-streaming-on-aws-with-amazon-s3/live-streaming-on-aws-with-amazon-s3.pdf).

Lower-cost alternatives are retaining starting-page-only coverage (no incremental cost) or checking a smaller page sample (lower cost, incomplete scanned-page coverage). Neither fulfils the requested coverage across all scanned pages.

The product owner approved this implementation and incremental-cost estimate. Deployment is not included.

## Local verification outcome

Implemented and verified locally on September 17, 2026. Fresh scan `d9b30461-064e-4f5f-9e4b-751ed1912113` completed ten pages in approximately 75 seconds. All ten pages retained verified hidden-link captures and each independently qualified with eight retained links. The report shows one Hidden outbound links issue across ten pages, expandable per-page evidence and 10/10 capture coverage. Site score remained 73; site-integrity findings remain score-neutral. Each additional-page projection was approximately 1.9–2.0 KB in this scan, below the 8 KB-per-copy planning assumption. This one scan does not establish a production billing measurement.

Contract, provenance rejection, concern policy, report/export and browser-capture regression checks passed. No production deployment was performed.

### Overview count presentation (September 17, 2026)

The executive overview presents Services and Hidden links separately from Requests,
Cookies & storage, and Embedded frames. Hidden-link totals count retained link
references once per captured page, rather than claiming distinct destination URLs;
missing findings do not establish zero links and limited captures use a lower bound.
The verified local ten-page report contains 80 occurrences (eight on each page).
Priority issue descriptions include the same count and use concise page labels.

Embed priority descriptions use a conservative distinct-source lower bound from
already eligible concern-policy rows. Query-free frame sources are retained (up to
eight per page), combined across eligible pages, and deduplicated; no inventory label
creates a finding or changes scoring. This requires no additional browser run or
model call. Estimated incremental metadata storage for the observed ten-page workload
is under $0.10/month at 100,000 scans; it falls within the pre-approved sub-$1 threshold.

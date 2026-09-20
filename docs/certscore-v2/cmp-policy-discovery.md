# CMP-assisted publisher policy discovery

`cmp_policy_discovery.v1` adds discovery provenance to the existing policy lane.
It does not establish policy presence, ownership, GDPR coverage, or a finding.
The lane still fetches and validates the document, retains typed evidence, and
uses the existing WC01 concern/policy/checklist pipeline.

## Supported surfaces

- Static and already-rendered anchors inside registered OneTrust, Cookiebot,
  TrustArc, Didomi, Quantcast Choice, Usercentrics, Termly, and Transcend DOM
  scopes. Existing open shadow roots are included; closed roots and unopened
  preference centers are not opened or clicked.
- Didomi's exact `window.didomiConfig.app.privacyPolicyURL` publisher field.
  Static extraction accepts a bounded JSON object assignment. The existing
  policy browser can read the equivalent JavaScript configuration using own
  data properties, without invoking getters or CMP methods.
- TrustArc's `privacypolicylink` initialization parameter on the canonical
  `https://consent.trustarc.com/notice` script. Its declared `domain` must match
  the scanned site's registrable domain.

Configuration paths are deliberately specific. `privacyPolicyUrl` on an
arbitrary object is not enough. No GVL/vendor recursion, new configuration
requests, response-body interception, readiness waits, or model calls are added.
No reliable publisher configuration adapter is claimed for the other providers;
those providers currently use DOM discovery only.

Adapter references:

- [Didomi web preferences: publisher privacy policy configuration](https://developers.didomi.io/cmp/web-sdk/consent-notice/preferences)
- [TrustArc implementation guide](https://consent.trustarc.com/asset/TrustArc_Cookie_Consent_Manager_Implementation_Guide.pdf)
- [Usercentrics vendor privacyPolicyUrl field](https://docs.usercentrics.com/cmp_browser_sdk/4.42.0/interfaces/ACMVendor.html)
  illustrates why generic field-name extraction is unsafe.

## Canonical integration

The existing `PolicySurfaceCandidate` and `PolicySurfaceObservation` carry an
optional `cmpDiscovery` array, capped at four entries. Each entry records the
version, source (`cmp_dom` or `cmp_config`), canonical provider name, source page,
and bounded DOM/config locator. Old observations remain readable without this
field. The typed early packet and terminal evidence retain and hash this field.
No customer-facing schema, score rule, or finding mapping is introduced.

For CMP-related candidates, explicit site links precede CMP DOM links, which
precede verified publisher configuration paths. They precede metadata/guessed
paths. Duplicate URLs share one candidate while retaining bounded provenance;
a stronger site link keeps its source priority. Existing non-CMP candidate
selection is preserved. New configuration candidates use deterministic link
ranking and do not enlarge the model's link-classification input.

Vendor/partner-list DOM subtrees and known CMP-provider privacy pages are
excluded from publisher candidates. Arbitrary vendor metadata and script/comment
anchor strings are not observed DOM links. Configuration URLs remain candidates,
not observed clickable controls. Every retained document still requires the
existing substance and publisher-ownership checks; a cross-domain publisher
notice can pass those checks, while vendor/provider documents cannot satisfy
publisher policy presence merely because they are linked from a CMP.

## Bounds and latency

- Parse at most 500,000 existing HTML characters, 100,000 tokens, 256 nested
  elements, 64,000 characters per static configuration, and four config URLs.
- Reuse the policy browser and its existing 1,000-element discovery limit.
- Preserve fetch concurrency, candidate fetch limits, retries, lane deadlines,
  and publication barriers. No new lane, timeout allowance, or model invocation.
- Local extraction benchmark: 60 paired samples after warmup per fixture.
  Added static extraction p95 was approximately 1.5 ms (102 links), 18.5 ms
  (1,002 links), and 37.6 ms (4,002 links). Didomi readback p95 was 0.6 ms.
  A separate paired browser benchmark measured 0.8–8.5 ms p95 added DOM
  inspection time. These are local microbenchmarks, not production total-scan
  percentiles.
- Proposed acceptance budgets remain 100 ms p95 added extraction and 250 ms p95
  added total scan duration. A matched production cohort is still needed to
  measure the latter; an unchanged deadline alone does not prove it.

Estimated recurring increase is below $1/month at 100,000 scans and existing
retention, assuming average added work stays below roughly 100 ms per scan on
the 3,008 MB worker. Using [AWS Lambda duration pricing](https://aws.amazon.com/lambda/pricing/)
at $0.000016667/GB-second, 100 ms adds about
$0.49/month compute; bounded provenance storage is estimated below $0.10/month.
This estimate excludes additional fetch slots, model calls, or retention changes,
which are not part of this feature. Reassess before expanding these bounds.

## Related retention repair

Early/terminal policy normalization now enforces the existing 32-observation
packet cap after deduplication on completed, partial, failed, and budget-limited
exits. It preserves fetched documents before lower-priority links, records an
explicit truncation diagnostic, and uses the same retained set for hashing and
terminal output. This prevents a partial policy lane from losing its entire
packet solely because it retained more than 32 observations. It does not
convert a failed fetch into a captured policy or repair historical scans.

The related OneTrust document resolver honors the exact locale declared in the
page's `OneTrust.NoticeApi.LoadNotices` call when selecting the notice metadata's
`languages` entry. It still follows at most one selected metadata URL inside
the existing 2.5-second child allowance. An explicitly requested missing locale
is not replaced with another language.

The policy capture deadline now reserves up to two seconds (20% for short
budgets) inside the unchanged output deadline for existing cleanup, typed
normalization, and handoff. This reduces capture time instead of adding a late
publication or extending scan latency.

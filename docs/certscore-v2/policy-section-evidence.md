# Policy section evidence

Policy disclosure extraction uses the canonical policy-evidence lane and shared
Article 13 classifiers/validators. Complete bounded heading/body, list and table
evidence is preferred over short keyword windows. Table headers remain attached
to their values, and source-document and excerpt hashes retain provenance.
Substantive observed evidence wins over a generic topic mention. Automated-decision
rights alone do not describe actual decision practices; unrelated sentences must
not supply missing practice/effect context.

Scanner HTML text and the topic classifier share entity decoding, including German
umlauts, sharp S and section signs. German controller/contact, purpose-expiry
retention and supervisory complaint clauses belong in the canonical multilingual
classifier. Evidence search uses the same hyphen normalization as classification;
an unlocated match must not borrow the document introduction as evidence.

Report scope labels refer to the starting page and its URL, including when the
entry URL is not a homepage. Site inventory counts remain aggregated across scanned
pages. Classification-review counts are descriptive and separate from priority
issues; scan completion does not establish complete policy-topic confirmation.

The existing limits remain 1,200 characters per retained section and 640 per
compact disclosure signal. Sentence/word boundaries are preferred within these
limits, without treating abbreviated legal citations as sentence endings.

Topic coverage diagnostics keep three independent axes:

- `documentRetentionState`: complete, truncated or unavailable retained text.
- `sectionExtractionState`: complete, partial, truncated or malformed extraction.
- `evaluationState`: observed or unknown topic evidence.

The first two fields are optional for historical v1 records. The conservative
aggregate `coverageState` remains unchanged. Complete document retention does not
prove complete section analysis, and unknown topics do not become absence findings.

Production projection still passes through the existing ownership, quality and
topic gates, typed evidence, normalized concerns, concern policy and checklist.
Disclosure presence is not a legal-compliance conclusion. No new absence policy,
score rule, model call, browser invocation, timeout or retry is introduced.

Estimated incremental evidence-storage cost from longer excerpts and bounded
diagnostic fields is below $1/month at 100,000 scans/month and 30-day retention;
all existing retention budgets are unchanged. No deployment accompanies this change.

Regression coverage lives in `policy-section-regression.test.ts` (scan-core),
`policy-section-pipeline.test.ts` (web), and the existing shared Article 13 and
multilingual classifier suites.

## Bounded topic diversity and production-review follow-up

Both the 80-section extraction budget and 24-section retained inventory reserve
the strongest existing evidence for each canonical Article 13 topic before
filling remaining slots. Repeated processing-purpose sections cannot displace
late retention, rights, contact, transfer or complaint disclosures. Selected
sections retain document order, original offsets and hashes. Shared classifier
matches are reused within the extraction; no fetch, model, timeout or retention
limit increases. A long-policy fixture verifies all ten disclosure topics through
the observed-only production adapter, normalized concerns and checklist, including
the negative ownership gate. Generic multilingual business copy remains excluded.

Policy-surface inspection optionally retains bounded retrieval counts and failure
categories, distinguishing failed observed links from other candidates. Historical
records without these diagnostics remain readable. These diagnostics explain
coverage only and cannot authorize absence findings. Added metadata storage is
estimated below $0.10/month at 100,000 scans and 30-day retention.

The canonical coverage policy consumes the policy-approved no-go concern to limit
normal-page transport conclusions and runtime absence claims. It preserves the
underlying blocked-page facts, independent TLS/HTTP probes and positive runtime
evidence. Storage review explanations reuse the typed storage assessment and
identify unresolved classification, inventory reconciliation and timing separately;
eligibility and scoring thresholds are unchanged. Existing production records are
not rewritten and no deployment or live rescan is performed.

# Passive form-data destination tracing MVP

The runtime-evidence lane observes native main-document input, change and submit
DOM events during its existing window. It never fills or submits forms, opens an
extra browser, extends the scan, or invokes a model. Most unattended scans will
observe no such event: report submission behavior as not tested, never safe.
Declared form actions remain informational, including legitimate third-party form
providers. A normal static form is not exercised by this feature.

## Canonical rule

Verified lane artifact → persisted form-destination projection → normalized privacy
concern → concern policy → unified finding → executive summary, Top priorities and
Forms details. Only the runtime lane owns this evidence. A warning requires:

- A document-bound personal-data form interaction with retained field metadata.
- An exact field-name AND value match in a captured request's query or supported
  body format. Timing by itself never qualifies.
- A corresponding observed network response, and a destination outside both the
  page's registrable domain and the declared form action's registrable domain.

“Unexpected” means outside that declared destination, not malicious or undisclosed.
An observed response is stronger evidence of receipt, not proof of misuse. No
exfiltration claim, legal conclusion or score deduction is created. Failed requests,
requests with no retained response, timing-only associations, first-party requests
and the declared third-party recipient remain informational. Response-only metadata
cannot manufacture a field-value match. Request IDs are checked against the verified
network inventory and response records before persistence. Missing/wrong-document
or unverified evidence fails closed.

## Evidence and privacy

`form_trace:event:<n>`, `form_trace:field:<event>:<n>` and
`form_trace:request:<n>` resolve through `resolveFormTraceEvidence`. Each event
retains its page/document token, time, native form index, declared action and fields.
Each request retains its network request ID, sanitized URL, method, registrable
domain, first-/third-party classification, response state, event reference and
match references. Both field and request records retain the same session-keyed
HMAC for matched values. Entered values and request bodies are never persisted by
this tracer; the per-session key and transient values are discarded at finalization.
URL queries/fragments are omitted; matching personal values in destination paths
are redacted. References and retained fingerprints demonstrate the observed match
without exposing the original value. They do not permit recovery of the value.

## Coverage limits

Starting-page runtime lane only. Native input/change are sampled once per form and
kind, with up to 10 total events, 30 fields per event, 100 request records, and
32 KiB supported request bodies. Requests associated by time are labeled as such,
not described as caused by the form. Every retained request after an event is listed
within these bounds; truncation is explicit. Only URL-encoded bodies, flat JSON
string fields and query parameters have payload matching. Multipart/files,
passwords, nested/encoded/encrypted payloads, unassociated controls, inaccessible
frames and programmatic submit() without a native event are not fully traced.
There is no claim of complete submission-flow coverage. Additional crawl pages and
Accept/Reject sessions are not implicitly included. Historical reports are unchanged.

Estimated incremental cost: below $1/month at 100,000 scans/month and 30-day
retention using bounded records, no additional sessions/network/model requests or
provisioned capacity. Real scans typically retain only empty coverage metadata.
Development preview: `/dev-fixtures/form-destinations` (synthetic evidence).

# Bounded custom Accept control binding

`custom_accept_control.v1` extends canonical Accept discovery to a narrow class
of non-CMP controls already captured by the canonical consent inventory: spans,
divs and custom elements with a live inline/property `onclick` function.

## Authorization and evidence

The existing first-layer, canonical multilingual Accept classification, consent
context, unique control/container, enabled/visible hit target and exact-target
authorization checks remain required. At most eight custom candidates per
geometry pass are read inside the existing resolver deadline. An overflowing candidate set remains
ambiguous rather than becoming a partial uniqueness claim.

The custom binding requires composed ancestry to the retained unique consent
container. Forms, editable controls, link/label ancestry, disabled/inert scopes,
and composite interactive descendants are excluded. A plain label, pointer
cursor, handler attribute string, or delegated ancestor handler is insufficient.
The live property must resolve to a function; the scanner does not invoke or
interpret that function. Its bounded source is hashed in memory and discarded.

Discovery, last-mile proof and dispatch compare the typed binding. Changed or
missing handler source/scope fails closed. The proof retains policy version,
tag, scope and handler-source hash, together with existing frame/target/label
proof. It retains no handler source, raw storage values or new screenshot.
Named CMPs use their registered recipes; this path cannot bypass their exact
selectors. Native/ARIA action discovery and Reject behavior remain unchanged.

The proof is an optional versioned extension to action-control proof v2. A new
`canonical-control:accept:custom-v1:` recipe requires it. Historical v1/v2 proof
is read unchanged. Retained packet verification, typed report projection and
persistence preserve the binding; no display fallback or new finding/scoring
path is added. Deploy updated contract consumers before scanner producers.

## Completion and latency

One verified click and completed bounded after-action capture can produce
Succeeded. Succeeded with confirmation still requires independently verified
consent state. A receipt, hidden banner or custom-control binding is not consent
registration. Ambiguous/unverifiable controls remain score-neutral limitations.

This adds no lane, browser, click, model call, search timeout, observation window
or tail wait. Each optional read is capped at 100ms within existing search/result
budgets. DOM reads are scoped to retained custom candidates; native controls do
not incur them. Negative results are not cached across revisions or pending
handler installation. Estimated incremental compute is below $0.50/month at
100,000 scans if added work averages under 100ms per scan at 3GB; this is an
estimate, not a hard spend cap. No paid API or infrastructure capacity is added.

## Verification and limits

Loopback browser fixtures exercise inline/property spans, divs, custom elements
and open-shadow controls through observation, typed packet and report projection.
Negative fixtures cover delegated-only handlers, pointer styling, transactional
forms, conflicting/misleading labels, duplicates, replaced handlers and stale
binding. Contract tests reject missing/malformed binding and preserve historical
proof; serialization retains the new evidence unchanged.

The local positive fixtures resolved in 41–147ms on the verification run. These
are controlled fixture timings, not a production coverage or latency benchmark.
Mixed native/custom choices and unreadable competing custom choices also remain
ambiguous. The existing native, named-CMP, registration and execution regressions
are included in verification.

Direct `addEventListener` registrations without native/ARIA semantics or an
`onclick` property, framework delegation, closed-shadow custom controls and
controls outside the existing bounded inventory remain unsupported by this new
path. They need separately verified binding or registered recipes, not guessed
clicks. No new public-site calibration or production deployment is implied.

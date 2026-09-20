import { getDomain } from "tldts";
import { formDestinationProjectionSchema, formDestinationTraceSchema, type CanonicalEvidenceBundle } from "@certscore/contracts";
/** Only the verified runtime lane may supply form event/payload relationships. */
export function projectFormDestinations(bundle: CanonicalEvidenceBundle, source: { sha256?: string; verificationStatus?: string } | undefined) {
  if (source?.verificationStatus !== "verified" || !/^[a-f0-9]{64}$/.test(source.sha256 ?? "")) return null;
  const trace = formDestinationTraceSchema.safeParse(bundle.formDestinationTrace);
  if (!trace.success) return null;
  const duration = Date.parse(bundle.completedAt) - Date.parse(bundle.startedAt);
  const snapshots = bundle.runtimeMetadataSnapshots ?? bundle.domSnapshots;
  if (!Number.isFinite(duration) || trace.data.events.some(event => event.observedAtMs > duration || !snapshots.some(snapshot => snapshot.url === event.documentUrl && snapshot.documentIdentity?.token === event.documentToken)) ||
    trace.data.requests.some(request => request.observedAtMs > duration || !bundle.networkEvents.some(network => network.requestId === request.networkRequestId))) return null;
  for (const request of trace.data.requests) {
    const event = trace.data.events.find(e => e.evidenceRef === request.eventRef)!;
    const network = bundle.networkEvents.find(n => n.requestId === request.networkRequestId)!;
    const host = (url: string) => getDomain(url, { allowPrivateDomains: true }) ?? new URL(url).hostname;
    if (!network.url || network.method !== request.method || network.timestampMs !== request.observedAtMs || host(network.url) !== request.domain || host(request.url) !== request.domain ||
        event.actionDomain !== host(event.actionUrl) || request.party !== (host(event.documentUrl) === request.domain ? "first_party" : "third_party") || request.outsideDeclaredDestination !== (event.actionDomain !== request.domain) ||
        (request.status === "response_observed" && !bundle.networkResponseEvents.some(r => r.requestId === request.networkRequestId))) return null;
  }
  return formDestinationProjectionSchema.parse({ contractVersion: "certscore.form-destination-projection.v1", scanId: bundle.scanId, sourceHash:source.sha256, verificationStatus:"verified", trace:trace.data });
}

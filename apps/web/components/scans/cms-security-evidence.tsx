import React from "react";
import type { CmsSecurityProjection } from "@certscore/contracts";
import { DisclosureChevron } from "./report-finding-row";

/** The assessment is persisted upstream; this view neither detects nor promotes findings. */
export function CmsSecurityEvidence({ projection }: { projection?: CmsSecurityProjection | null }) {
  if (!projection?.assessment.detections.length) return null;
  const { assessment } = projection;
  return <details id="cms-security-evidence" className="group/cms-security my-3 rounded-lg border border-zinc-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-600 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0">CMS &amp; version evidence <span className="ml-2 font-normal text-zinc-500">{assessment.detections.map(row => row.name).join(", ")}</span></span>
      <DisclosureChevron className="shrink-0 text-zinc-400 group-open/cms-security:rotate-180" />
    </summary>
    <div className="space-y-4 border-t border-zinc-200 p-4 text-sm">
      <p className="text-zinc-600">Passive starting-page evidence. Declared versions are not confirmed runtime versions. A catalogue match identifies a potential exposure; installed patches and advisory prerequisites need administrator verification.</p>
      {assessment.detections.map(detection => <div key={detection.evidenceRef} id={detection.evidenceRef} className="space-y-2 border-b border-zinc-100 pb-3">
        <p className="font-semibold">{detection.name} · {detection.version ?? (detection.observedVersions.join(", ") || "Version unknown")}</p>
        <p className="text-zinc-600">{detection.versionBasis === "declared" ? "Declared by the page" : "Inferred from an asset path"} · {detection.confidence} confidence in identification · {detection.informationalOnly ? "Hosted service — informational only" : detection.versionStatus === "declared_exact" ? "Exact declared version" : "Version matching unavailable"}</p>
        <p className="break-all text-xs text-zinc-500">{detection.evidenceRef} · {detection.evidenceRefs.map(ref => <a key={ref} className="mr-2 underline" href={`#${ref}`}>{ref}</a>)}</p>
      </div>)}
      {assessment.matches.map(match => <div key={match.evidenceRef} id={match.evidenceRef} className="space-y-1 rounded border border-amber-200 p-3">
        <p className="font-semibold">{match.record.kind === "vulnerability" ? "Affected-version match" : "Support-status match"}: {match.record.id}</p>
        <p>{match.record.title} · Declared {match.observedVersion} matches {match.matchedRange}.</p>
        {match.record.fixedVersions?.length ? <p>Outdated against this security fix. Vendor fixed releases: {match.record.fixedVersions.join(", ")}.</p> : null}
        <p className="text-zinc-600">{match.record.qualification}</p>
        <p><a href={match.record.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">Lifecycle / vulnerability source</a> · <a href={`#${match.detectionRef}`} className="text-sky-700 underline">Version evidence</a></p>
        <p className="break-all text-xs text-zinc-500">{match.evidenceRef}</p>
      </div>)}
      {!assessment.matches.length ? <p className="text-zinc-600">No match in the reviewed catalogue. This does not establish that the CMS is current, supported or free of vulnerabilities.</p> : null}
      <details><summary className="cursor-pointer font-medium">Retained source signals</summary>
        <ul className="mt-2 space-y-3">{projection.signals.map(signal => <li id={signal.evidenceRef} key={signal.evidenceRef} className="break-words">
          <p className="font-medium">{signal.kind === "meta_generator" ? "Meta generator" : "Same-origin asset path"}: <code className="break-all">{signal.value}</code></p>
          <p className="break-all text-xs text-zinc-500">{signal.evidenceRef} · artifact {signal.artifactRef}</p>
          <a className="break-all text-sky-700 underline" href={signal.sourceUrl} target="_blank" rel="noopener noreferrer">{signal.sourceUrl}</a>
        </li>)}</ul>
      </details>
      <p className="break-all text-xs text-zinc-500">Catalogue reviewed {assessment.catalogueReviewedAt}; selected advisories only. Support status is unknown for branches without a lifecycle match. Source SHA-256: {projection.sourceHash}</p>
    </div>
  </details>;
}

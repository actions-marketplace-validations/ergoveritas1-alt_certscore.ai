import React from "react";
import { notFound } from "next/navigation";
import { FormDestinationEvidence } from "../../../components/scans/form-destination-evidence";
import { SitePriorityReview } from "../../../components/scans/site-priority-review";
import { FullSiteExecutiveSummary } from "../../../components/scans/full-site-executive-summary";
import { buildUnifiedFindingDisplayPackets } from "../../../lib/scans/unified-findings";
import { buildSitePriorityReview } from "../../../lib/scans/full-site-priority-review";
import { formDestinationProjectionSchema } from "@certscore/contracts";
export const dynamic = "force-dynamic";
export default async function FormDestinationsPreview({ searchParams }: { searchParams: Promise<{ observed?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const observed = (await searchParams).observed === "1";
  const projection = formDestinationProjectionSchema.parse({ contractVersion:"certscore.form-destination-projection.v1",scanId:"fixture",sourceHash:"a".repeat(64),verificationStatus:"verified",trace:{contractVersion:"certscore.form-destination-trace.v1",mode:"passive",events:observed?[{evidenceRef:"form_trace:event:0",kind:"submit",observedAtMs:100,documentUrl:"https://forms.example/",documentToken:"fixture",formIndex:0,actionUrl:"https://forms.example/send",actionDomain:"forms.example",fields:[{evidenceRef:"form_trace:field:0:0",name:"email",category:"email",personal:true,valueHmac:"b".repeat(64)}]}]:[],requests:observed?[{evidenceRef:"form_trace:request:0",networkRequestId:"request-1",eventRef:"form_trace:event:0",observedAtMs:200,url:"https://recipient.example/collect",domain:"recipient.example",method:"POST",party:"third_party",outsideDeclaredDestination:true,status:"response_observed",relation:"exact_field_value_match",matches:[{fieldRef:"form_trace:field:0:0",valueHmac:"b".repeat(64),location:"body"}]}]:[],coverage:{truncated:false,unsupportedPayloads:0,scope:"main_document_existing_window",activeSubmission:false}}});
  const packets = buildUnifiedFindingDisplayPackets({ runtimeArtifacts:{formDestinations:projection},reviewFindingCandidates:[],validationFindings:[],validationFindingLookup:new Map() });
  const priorities = buildSitePriorityReview([],[{id:"home",url:"https://forms.example/",homepage:true,findingIds:[]}],[],packets);
  return <main className="mx-auto max-w-6xl p-4"><h1 className="text-xl font-semibold">Passive form destinations · local preview</h1><p className="my-3 text-sm">Synthetic evidence through the canonical concern, policy and report pipeline. No form is submitted.</p><nav className="flex gap-4"><a className="text-sky-700 underline" href="?observed=0">No interaction observed</a><a className="text-sky-700 underline" href="?observed=1">Matched unexpected recipient</a></nav>
    <FullSiteExecutiveSummary pending={false} scannedPages={1} statusLabel="Development fixture" score={{value:100,scoredPages:1,priorityReview:priorities}} homepageVerdict={priorities[0]?.summary ?? "Submission behavior not tested. A passive scan cannot establish where an untouched form sends its data."} snapshot={<p className="text-sm">Form-data warnings are score-neutral.</p>} />
    <SitePriorityReview findings={priorities} pending={false} sitewideAvailable scannedPages={1}/><h2 className="mt-5 text-xl font-semibold">Forms & fields</h2><FormDestinationEvidence projection={projection} warning={priorities.length>0}/></main>;
}

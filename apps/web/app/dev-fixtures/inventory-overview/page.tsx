import { SiteIntegrityEvidence } from "../../../components/scans/site-integrity-evidence";
import { notFound } from "next/navigation";
import { buildInventoryPreviewData } from "./inventory-preview-data";
import { EvidenceDirectory, ReportScanNext, SignalSnapshot } from "../../../components/scans/report-lab/shadow-scan-report";
import { InventoryOverviewPreview } from "./inventory-overview-preview";

export const dynamic = "force-dynamic";

export default async function InventoryOverviewPreviewPage({ searchParams }: { searchParams: Promise<{ inventory?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const selected = (await searchParams).inventory;
  const scenario = selected === "empty" || selected === "single" || selected === "large" ? selected : "supplied";
  // Keep the interactive preview tree in one SSR/client boundary so useId
  // follows the same component structure on both sides of hydration.
  const data = buildInventoryPreviewData(scenario);
  return <InventoryOverviewPreview data={data}
    signalSnapshot={<SignalSnapshot report={data.snapshot} siteOverview />}
    scanNext={<ReportScanNext defaultScanFrom="california" mode="authenticated" report={data.snapshot} />}
    evidenceDirectory={<EvidenceDirectory compact report={data.snapshot} additionalEvidence={<SiteIntegrityEvidence finding={data.sampleIntegrityFinding} sampleNotice={`Illustrative example for sample-site.example. These links were not observed on ${data.snapshot.scan.host}.`} />} />} />;
}

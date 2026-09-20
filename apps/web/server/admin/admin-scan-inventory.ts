import { cmsSecurityProjectionSchema, collectionSurfaceAssessmentSchema, siteIntegrityProjectionSchema } from "@certscore/contracts";
import { isReadableScanReportProjectionReady, type ScanReportProjectionReadiness } from "../scans/scan-report-projection-contract";

export type AdminScanInventory = {
  hiddenLinks: { count: number; limited: boolean } | null;
  forms: { count: number; limited: boolean } | null;
  cms: string | null;
};

type InventorySnapshot = ScanReportProjectionReadiness & {
  admin_site_integrity?: unknown;
  admin_collection_surfaces?: unknown;
  admin_cms_security?: unknown;
};

/** Display retained starting-page projections only; never infer observations or findings. */
export function projectAdminScanInventory(scanId: string, snapshot: InventorySnapshot | null | undefined, noGo: boolean): AdminScanInventory {
  const summary: AdminScanInventory = { hiddenLinks: null, forms: null, cms: null };
  if (noGo || !isReadableScanReportProjectionReady(snapshot)) return summary;

  const integrity = siteIntegrityProjectionSchema.safeParse(snapshot?.admin_site_integrity);
  if (integrity.success && integrity.data.scanId === scanId && integrity.data.observation.scope === "starting_page_main_document") {
    summary.hiddenLinks = { count: integrity.data.observation.links.length, limited: integrity.data.observation.truncated };
  }

  const forms = collectionSurfaceAssessmentSchema.safeParse(snapshot?.admin_collection_surfaces);
  if (forms.success && forms.data.scanId === scanId && forms.data.sourceHash && forms.data.coverage &&
      forms.data.assessmentStatus !== "not_testable" && forms.data.coverage.status !== "failed" &&
      forms.data.coverage.retainedFormCount === forms.data.forms.length) {
    summary.forms = {
      count: forms.data.forms.length,
      limited: forms.data.assessmentStatus === "limited" || forms.data.coverage.status !== "complete" ||
        forms.data.coverage.candidateScanTruncated || forms.data.coverage.retentionTruncated,
    };
  }

  const cms = cmsSecurityProjectionSchema.safeParse(snapshot?.admin_cms_security);
  if (cms.success && cms.data.scanId === scanId) {
    summary.cms = cms.data.assessment.detections.map(detection => {
      const version = detection.version ?? detection.observedVersions.join(" / ");
      return `${detection.name}${version ? ` ${version}` : " (version unknown)"}${detection.versionStatus === "conflicting" ? " (conflicting)" : ""}`;
    }).join(", ") || "Not detected";
  }
  return summary;
}

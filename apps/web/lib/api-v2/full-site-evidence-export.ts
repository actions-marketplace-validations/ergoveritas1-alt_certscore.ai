import type { FullSiteReportResponse } from "../../server/scans/full-site-report";

/** Export the same display-safe rows as the sitewide report, without its table pagination. */
export function fullSiteEvidenceExport(scanId: string, report: FullSiteReportResponse) {
  if (report.pages.rows.length !== report.pages.total || report.resources.rows.length !== report.resources.total) {
    throw new Error("Full-site export requires all retained page and resource rows.");
  }
  return {
    ...report,
    pages: { ...report.pages, offset: 0, limit: report.pages.rows.length },
    resources: { ...report.resources, offset: 0, limit: report.resources.rows.length },
    collectionSurfaces: {
      ...report.collectionSurfaces,
      rows: report.collectionSurfaces.rows.map(row => {
        if (row.snapshot.status !== "available") return row;
        const source = new URL(row.snapshot.url, "https://certscore.ai");
        const pageId = source.searchParams.get("formPage");
        const formRef = source.searchParams.get("formRef");
        if (!pageId || !formRef || !/^[a-f0-9-]{36}$/i.test(pageId) || !/^collection_form_\d+$/.test(formRef)) {
          throw new Error("Invalid retained form snapshot reference.");
        }
        const query = new URLSearchParams({ formPage: pageId, formRef });
        return { ...row, snapshot: { ...row.snapshot,
          url: `https://certscore.ai/api/v2/scans/${scanId}/report-evidence/form-snapshot?${query}`,
          mediaType: "image/jpeg",
          retrieval: "Download with the same OAuth bearer credential for workspace scans; eligible anonymous scans require no credential. Withheld or unverifiable images are never served.",
        } };
      }),
    },
  };
}

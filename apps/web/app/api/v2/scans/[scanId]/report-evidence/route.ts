import { issueReportDownloadTicket, verifyReportDownloadTicket } from "../../../../../../lib/api-v2/report-download-ticket";
import { buildReportDisplayExport } from "../../../../../../lib/api-v2/report-display-export";
import { loadFullSiteReport } from "../../../../../../server/scans/full-site-report";
import { fullSiteEvidenceExport } from "../../../../../../lib/api-v2/full-site-evidence-export";
import { loadAuthorizedReportEvidence, ReportEvidenceAccessError } from "../../../../../../lib/api-v2/report-evidence-access";
import { reportEvidencePageSchema } from "@certscore/api-contracts";
import { API_V2_SCAN_ID_PATTERN, apiV2JsonResponse, buildApiV2Error } from "../../../../../../lib/api-v2/scan-resource";
import { buildReportEvidencePage, ReportPageCursorError } from "../../../../../../lib/api-v2/report-evidence-page";
import { parseBearerToken, validateCertScoreBearerToken } from "../../../../../../server/integrations/api-keys";
import { enforceApiV2ScanReadThrottle } from "../../../../../../server/pulse/api-v2-read-throttle";
import { loadAnonymousPersistedScanReportProjection, loadPersistedScanReportProjection } from "../../../../../../server/scans/scan-report-projection";
import { buildVerifiedTimelineReportModel } from "../../../../../../server/scans/verified-timeline-report-model";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ scanId: string }> }) {
  const requestId = crypto.randomUUID();
  const route = "api-v2-report-evidence";
  const reply = (body: unknown, status: number) => apiV2JsonResponse({ body, status, requestId, route, headers: { "Cache-Control": "private, no-store" } });
  const { scanId } = await context.params;
  const query = new URL(request.url).searchParams;
  const cursor = query.get("cursor");
  const download = query.get("format") === "download";
  if (download && cursor) return reply(buildApiV2Error({ code: "invalid_url", message: "Full downloads do not accept a page cursor." }), 400);
  if (!API_V2_SCAN_ID_PATTERN.test(scanId) || (cursor !== null && !/^v1\.[a-f0-9]{64}\.(0|[1-9]\d{0,9})$/.test(cursor))) {
    return reply(buildApiV2Error({ code: "invalid_url", message: "Invalid scan ID or cursor. Restart without a cursor." }), 400);
  }
  const ticket = query.get("downloadTicket");
  const signingSecret = process.env.CERTSCORE_OAUTH_JWT_SECRET?.trim() || process.env.JWT_SIGNING_KEY?.trim() || "";
  const ticketScope = ticket && download ? verifyReportDownloadTicket(ticket, scanId, signingSecret) : null;
  if (ticket !== null && !ticketScope) return reply(buildApiV2Error({ code: "forbidden", message: "Download link is invalid or expired. Request a fresh report evidence page through MCP." }), 403);
  try {
    const throttled = await enforceApiV2ScanReadThrottle({ request, requestId, route, scanId, costClass: "report_page" });
    if (throttled) return throttled;
    let downloadOrganizationId: string | null = null;
    const record = ticketScope
      ? await loadPersistedScanReportProjection({ scanId, organizationId: ticketScope.organizationId })
      : await loadAuthorizedReportEvidence({
      scanId, bearer: parseBearerToken(request), validate: validateCertScoreBearerToken,
      loadOwned: async scope => {
        const owned = await loadPersistedScanReportProjection(scope);
        if (owned) downloadOrganizationId = scope.organizationId;
        return owned;
      }, loadPublic: loadAnonymousPersistedScanReportProjection,
    });
    if (!record || record.scan.status !== "completed") return reply(buildApiV2Error({ code: "not_found", message: "A completed, authorized report projection is not available. Poll scan status; export after report readiness." }), 404);
    const { fullSite: _privateConfiguration, ...report } = await buildVerifiedTimelineReportModel(record);
    const isFullSite = record.scan.scanConfigJson?.fullSite === true;
    const fullSite = isFullSite ? await loadFullSiteReport(scanId, new URLSearchParams({ kind: "all" }), true) : null;
    if (isFullSite && !fullSite) return reply(buildApiV2Error({ code: "not_found", message: "Full-site evidence is unavailable; no partial export was returned." }), 404);
    if (fullSite && ["waiting_homepage", "running"].includes(fullSite.summary.state.status)) {
      return reply(buildApiV2Error({ code: "invalid_url", message: "Full-site capture is still in progress. Wait for the full-site report to finish before starting its export." }), 409);
    }
    const exportedReport = fullSite ? { ...report, fullSiteReport: fullSiteEvidenceExport(scanId, fullSite) } : report;
    const displayReport = buildReportDisplayExport(exportedReport);
    const serialized = JSON.stringify(displayReport);
    if (download) return new Response(serialized, { headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="certscore-report-${scanId}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    } });
    const downloadUrl = new URL(`/api/v2/scans/${scanId}/report-evidence?format=download`, process.env.NEXT_PUBLIC_APP_URL || "https://certscore.ai");
    let expiresAt: string | undefined;
    if (downloadOrganizationId) {
      const issued = issueReportDownloadTicket(scanId, downloadOrganizationId, signingSecret);
      downloadUrl.searchParams.set("downloadTicket", issued.ticket);
      expiresAt = issued.expiresAt;
    }
    const page = buildReportEvidencePage({ scanId, report: displayReport, cursor });
    return reply(reportEvidencePageSchema.parse({ ...page, download: {
      url: downloadUrl.toString(),
      ...(expiresAt ? { expiresAt } : {}),
      mediaType: "application/json", bytes: Buffer.byteLength(serialized, "utf8"),
      authentication: expiresAt ? "short_lived_report_link" : "public",
      instructions: "One HTTP download returns the full report display JSON. Open the returned URL directly with your HTTP/file download tool; do not attach or request OAuth credentials. Private-report links carry a report-only capability valid for five minutes; treat them as confidential and do not publish or log them. On expiry, call this MCP tool for a fresh link. If your host blocks file downloads, continue with this MCP tool and nextCursor. Resolve reportContentRef pointers within the downloaded document. Snapshot images remain separate links.",
    } }), 200);
  } catch (error) {
    if (error instanceof ReportEvidenceAccessError) return reply(buildApiV2Error({ code: "forbidden", message: error.message }), 403);
    if (error instanceof ReportPageCursorError) return reply(buildApiV2Error({ code: "invalid_url", message: error.message }), 409);
    console.error("[api-v2-report-evidence] request failed", { requestId, error });
    return reply(buildApiV2Error({ code: "internal_error", message: "Report evidence is temporarily unavailable. Try again later." }), 500);
  }
}

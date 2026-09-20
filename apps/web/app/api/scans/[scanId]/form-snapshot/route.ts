import { getPublicScanById } from "../../../../../server/scans/get-scan-by-id";
import { loadSinglePageFormSnapshot } from "../../../../../server/scans/local-v2-dag-report";
import { enforceApiV2ScanReadThrottle } from "../../../../../server/pulse/api-v2-read-throttle";
import { runtimeGraphQuotaRequest } from "../../../../../server/scans/runtime-evidence-graph-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(scanId)) return new Response(null, { status: 400 });
  const throttled = await enforceApiV2ScanReadThrottle({ request: runtimeGraphQuotaRequest(request), requestId: crypto.randomUUID(), scanId, route: "form-snapshot", profile: "terminal", detail: "evidence" });
  if (throttled) return throttled;
  const scan = await getPublicScanById(scanId);
  if (!scan) return new Response(null, { status: 404 });
  try {
    const bytes = await loadSinglePageFormSnapshot(scan, new URL(request.url).searchParams.get("formRef") ?? "");
    return bytes ? new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }) : new Response(null, { status: 404 });
  } catch { return new Response(null, { status: 404 }); }
}

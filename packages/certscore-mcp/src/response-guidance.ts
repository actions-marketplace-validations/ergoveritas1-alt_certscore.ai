import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { transferResponseCapture } from './response-capture.js';

const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const string = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.slice(0, 1000) : null;

/** Presentation metadata only: never derive findings, eligibility or quota from observations. */
export function withResponseGuidance(tool: string, input: unknown, result: CallToolResult, now = Date.now()): CallToolResult {
  if (result.isError || !result.structuredContent) return result;
  const args = record(input), payload = record(result.structuredContent);
  const scan = payload.scan === null ? {} : Object.keys(record(payload.scan)).length ? record(payload.scan) : payload;
  const summary = record(scan.summary), provenance = record(scan.provenance);
  const scanId = string(scan.scanId) ?? string(scan.scan_id) ?? string(args.scanId);
  const status = string(scan.status);
  const completedAt = string(scan.completedAt);
  const parsedTime = completedAt ? Date.parse(completedAt) : NaN;
  const ageSeconds = Number.isFinite(parsedTime) && parsedTime <= now ? Math.floor((now - parsedTime) / 1000) : null;
  const isCreation = tool === 'certscore_scan_site';
  const active = ['queued', 'running', 'finalizing'].includes(status ?? '');
  const ready = ['completed', 'completed_limited'].includes(status ?? '');
  const pagination = record(payload.pagination);
  const hasMore = pagination.truncated === true;
  const nextOffset = hasMore && Number.isInteger(pagination.offset) && Number.isInteger(pagination.returned) && pagination.returned > 0
    ? pagination.offset + pagination.returned : null;
  let nextAction: Record<string, unknown> = { tool: null, arguments: null, instruction: 'Summarize the returned observations and coverage limitations.' };
  if (scanId && active) nextAction = { tool: 'certscore_get_scan_status', arguments: { scanId }, retryAfterSeconds: scan.retryAfterSeconds ?? null, instruction: 'Wait for the returned polling interval before checking status.' };
  else if (scanId && ready && payload.resultDisposition !== 'no_go' && ['certscore_scan_site', 'certscore_get_scan', 'certscore_get_scan_status', 'certscore_get_latest_domain_scan'].includes(tool)) nextAction = { tool: 'certscore_get_scan_bundle', arguments: { scanId }, instruction: 'Fetch the report bundle to summarize this completed scan.' };
  else if (tool === 'certscore_list_findings' && nextOffset !== null) nextAction = { tool, arguments: { scanId, offset: nextOffset, limit: pagination.limit }, instruction: 'Fetch the next page if more findings are needed.' };
  else if (payload.scan === null) nextAction = { tool: 'certscore_scan_site', arguments: null, instruction: 'No eligible retained scan was returned. Start a scan only if requested, using the intended public website URL.' };
  else if (['failed', 'cancelled', 'canceled', 'no_go'].includes(status ?? '') || payload.resultDisposition === 'no_go') nextAction = { tool: null, arguments: null, instruction: string(payload.recommendedNextAction) ?? 'Review the terminal error or no-go reason. Do not continue polling this scan.' };
  const findingIds = (Array.isArray(payload.findings) ? payload.findings : Array.isArray(payload.topFindings) ? payload.topFindings : [])
    .slice(0, 20).map((item: unknown) => string(record(item).id)).filter(Boolean);
  if (tool === 'certscore_explain_finding' && string(payload.id)) findingIds.push(payload.id);
  const guidance = {
    version: 'certscore.mcp-response-guidance.v1', tool, scanId, status,
    score: typeof scan.score === 'number' ? scan.score : typeof summary.score === 'number' ? summary.score : null,
    risk: string(scan.risk) ?? string(summary.risk),
    coverage: string(scan.coverage) ?? string(record(scan.coverage).status),
    reportUrl: string(scan.reportUrl) ?? string(record(scan.links).report),
    retrieval: isCreation ? 'creation_response' : tool.includes('latest_domain') ? 'latest_eligible_domain_scan' : 'retained_result',
    creationDecision: isCreation ? string(provenance.creationDecision) ?? (payload.reused === true ? 'reused_scan' : 'unknown') : 'not_requested',
    quotaConsumed: null,
    completedAt, ageSeconds, scanFrom: string(scan.scanFrom), findingIds,
    returnedRows: Array.isArray(payload.rows) ? payload.rows.length : null,
    evidenceLimits: { truncated: record(payload.evidenceMetadata).truncated ?? record(payload.mcpMetadata).truncated ?? null, total: record(payload.evidenceMetadata).total ?? null, returned: record(payload.evidenceMetadata).returned ?? null },
    pagination: Object.keys(pagination).length ? { ...pagination, nextOffset, complete: !hasMore } : null,
    nextAction,
  };
  const overview = `CertScore result: ${JSON.stringify(guidance)}\nNull means unavailable; read tools do not start a new scan. Quota consumption is unknown unless explicitly reported by the service.`;
  const explanation = tool === 'certscore_explain_finding'
    ? `\nFinding: ${JSON.stringify({ id: string(payload.id), observation: string(payload.evidenceSummary) ?? string(record(payload.evidence).summary), interpretation: string(payload.plainEnglish), reviewerAction: string(payload.nextStep) })}` : '';
  return transferResponseCapture(result, {
    ...result,
    _meta: { ...result._meta, 'ai.certscore/responseGuidance': guidance },
    content: [...result.content, { type: 'text', text: overview + explanation }],
  });
}

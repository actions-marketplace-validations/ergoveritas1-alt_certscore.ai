import {mcpRequestDetailsSchema} from '@website-signal-risk-scanner/shared';
import type {McpWorkflowEvent} from './mcp-workflows';

/** Caller polling only, within one already-isolated session/scan workflow. */
export function lightWorkflowMetrics(rows: McpWorkflowEvent[]) {
  const calls = rows.filter(r => r.surface === 'mcp_light').map(row => {
    const parsed=mcpRequestDetailsSchema.safeParse(row.request_details);
    const details=parsed.success ? parsed.data : null;
    return {row,details,start:Date.parse(details?.timing?.startedAt ?? ''),end:Date.parse(details?.timing?.responseGeneratedAt ?? '')};
  }).sort((a,b)=> (Number.isFinite(a.start)?a.start:Date.parse(a.row.occurred_at))-(Number.isFinite(b.start)?b.start:Date.parse(b.row.occurred_at)));
  let earlyPolls=0, measuredPolls=0, afterCompletion=0, internalReads=0, internalReadsKnown=0;
  let deadlineStart:number|null=null, deadline:number|null=null, completedAt:number|null=null, admittedAt:number|null=null, firstUsefulMs:number|null=null, firstBundleMs:number|null=null;
  for (const call of calls) {
    const summary=call.details?.response?.summary;
    if (call.row.tool_name==='certscore_scan_site' && call.row.outcome==='success' && admittedAt===null && Number.isFinite(call.start)) admittedAt=call.start;
    if (call.row.tool_name==='certscore_get_scan_status' && Number.isFinite(call.start)) {
      if (deadline!==null && deadlineStart!==null && call.start>=deadlineStart) { measuredPolls++; if (call.start<deadline) earlyPolls++; }
      if (completedAt!==null && call.start>=completedAt) afterCompletion++;
    }
    if (summary?.internalReadCount!==undefined) { internalReads+=summary.internalReadCount; internalReadsKnown++; }
    if (call.row.outcome!=='success' || !Number.isFinite(call.end)) continue;
    if (admittedAt!==null && call.end>=admittedAt) {
      if (firstUsefulMs===null && (summary?.firstResult==='preview' || ['completed','completed_limited'].includes(summary?.status??''))) firstUsefulMs=call.end-admittedAt;
      if (firstBundleMs===null && call.row.tool_name==='certscore_get_scan_bundle' && ['completed','completed_limited'].includes(summary?.status??'')) firstBundleMs=call.end-admittedAt;
    }
    if (['completed','completed_limited'].includes(summary?.status??'')) { completedAt=call.end; deadline=null; }
    else if (summary?.recommendedNextTool==='certscore_get_scan_status' && typeof summary.retryAfterSeconds==='number') { deadlineStart=call.end; deadline=call.end+summary.retryAfterSeconds*1000; }
  }
  return {earlyPolls,measuredPolls,afterCompletion,internalReads,internalReadsKnown,firstUsefulMs,firstBundleMs};
}

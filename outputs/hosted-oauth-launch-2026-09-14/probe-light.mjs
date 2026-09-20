import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { writeFileSync } from 'node:fs';
const evidence={at:new Date().toISOString(),surface:'MCP SDK Streamable HTTP client',profile:'light'};
const c=new Client({name:'certscore-release-acceptance',version:'1.0.0'});
await c.connect(new StreamableHTTPClientTransport(new URL('https://mcp.certscore.ai/mcp/light')));
evidence.server=c.getServerVersion(); evidence.tools=(await c.listTools()).tools.map(t=>t.name).sort();
const scanId='3c7db7ee-aff1-4a11-b5c5-0ca03a66265e'; evidence.scanId=scanId;evidence.calls=[];
for(const name of ['certscore_get_scan_status','certscore_get_scan_bundle','certscore_get_report_evidence_page']){
 const r=await c.callTool({name,arguments:{scanId,...(name.endsWith('bundle')?{detail:'summary',maxBytes:5000}:{})}});
 const p=r.structuredContent??{}; evidence.calls.push({name,isError:!!r.isError,keys:Object.keys(p),pagination:p.pagination,status:p.status});
 if(name.endsWith('evidence_page') && p.pagination?.nextCursor){let pages=1;let next=p.pagination.nextCursor;while(next&&pages<100){const r2=await c.callTool({name,arguments:{scanId,cursor:next}}); if(r2.isError)throw Error('page error');pages++; next=r2.structuredContent?.pagination?.nextCursor; } evidence.export={pages,complete:!next};}
}
await c.close();writeFileSync('outputs/hosted-oauth-launch-2026-09-14/light-production.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));

import assert from 'node:assert/strict';
import{createHash}from'node:crypto';
import{createRequire}from'node:module';
import test from 'node:test';
const require=createRequire(import.meta.url);const stub=require.resolve('server-only');(require.cache as Record<string,unknown>)[stub]={id:stub,filename:stub,loaded:true,exports:{}};

test('local real OAuth token exchange, status, bundle, refresh and same MCP session', {skip:!process.env.OAUTH_GATE_SCAN_ID,timeout:60000},async()=>{
  assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname));
  const issuer=process.env.OAUTH_ISSUER!,origin=process.env.MCP_PUBLIC_URL!;
  for(const u of [issuer,origin]) assert.ok(['localhost','127.0.0.1'].includes(new URL(u).hostname));
  const db=await import('@website-signal-risk-scanner/db');const oauth=await import('./mcp-oauth');
  const scanId=process.env.OAUTH_GATE_SCAN_ID!;
  const row=await db.queryOne<{organization_id:string;submitted_by_user_id:string}>("select organization_id,owner_user_id as submitted_by_user_id from mcp_oauth_refresh_tokens where client_id=$1 and revoked_at is null and expires_at>now() order by created_at desc limit 1",["certscore_cursor_hosted_oauth_v1"]);assert.ok(row?.organization_id&&row.submitted_by_user_id);
  const context={clientId:'certscore_cursor_hosted_oauth_v1',organizationId:row.organization_id,ownerUserId:row.submitted_by_user_id};
  const client=await oauth.getMcpOAuthClient(context.clientId);assert.ok(client);
  const resolution=await oauth.resolveMcpOAuthRequestedScopes({client,context,requestedScopes:['scan:read','scan:create','mcp']});assert.ok(resolution.approvedScopes.includes('scan:create'));
  const verifier='local-gate-verifier-'.repeat(4),redirectUri='http://localhost:8787/callback';
  const code=await oauth.createAuthorizationCode({...context,redirectUri,scopes:resolution.approvedScopes,codeChallenge:createHash('sha256').update(verifier).digest('base64url')});
  const hashes:string[]=[];let session:string|undefined,access:string|undefined;let id=0;
  const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
  async function token(params:Record<string,string>){const r=await fetch(issuer+'/api/v2/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:context.clientId})});assert.equal(r.status,200,'token exchange succeeds');const body=await r.json();hashes.push(hash(body.refresh_token));return body;}
  async function rpc(method:string,params:unknown){const r=await fetch(origin+'/mcp',{method:'POST',headers:{authorization:'Bearer '+access,'content-type':'application/json',accept:'application/json, text/event-stream',...(session?{'mcp-session-id':session,'mcp-protocol-version':'2025-11-25'}:{})},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});assert.equal(r.status,200,method+' transport');session??=r.headers.get('mcp-session-id')??undefined;const raw=await r.text();const body=JSON.parse(raw.trim().startsWith('{')?raw:raw.split('\n').find(x=>x.startsWith('data: '))!.slice(6));assert.equal(body.error,undefined,JSON.stringify(body.error));assert.notEqual(body.result?.isError,true,'tool must succeed');return body.result;}
  try{
    const original=await token({grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:redirectUri});access=original.access_token;
    await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'CertScore local OAuth refresh gate',version:'1'}});assert.ok(session);const firstSession=session;
    if(process.env.OAUTH_GATE_ALL_TOOLS === '1') {
      const check = await rpc('tools/call',{name:'certscore_get_connection_status',arguments:{}});
      assert.equal(check.structuredContent.diagnostics.workspaceAccess,'active');
      const {signCertScoreAccessToken}=await import('@certscore/mcp-auth');
      for (const scenario of ['expired','read_only','removed_member']) {
        const key=signCertScoreAccessToken({audience:origin,issuer,clientId:context.clientId,jwtSecret:oauth.getMcpJwtSecret(),organizationId:context.organizationId,subject:context.ownerUserId,userId:scenario==='removed_member'?'00000000-0000-4000-8000-000000000000':context.ownerUserId,scopes:scenario==='read_only'?['scan:read','mcp']:['scan:read','scan:create','mcp'],expiresInSeconds:scenario==='expired'?-3600:60});
        const response=await fetch(issuer+'/api/v2/auth/check?diagnostics=1',{headers:{authorization:'Bearer '+key}});
        if(scenario==='expired'){assert.equal(response.status,401);continue;}
        assert.equal(response.status,200); const result=await response.json();
        assert.equal(result.diagnostics.canRequestScanNow,false);
        assert.equal(result.diagnostics.quota,null);
        assert.equal(result.diagnostics.workspaceAccess,scenario==='removed_member'?'unavailable':'active');
      }
      const resources = await rpc('resources/list', {});
      assert.ok(resources.resources.some((r:any)=>r.uri==='certscore://connection'));
      const connection = await rpc('resources/read', {uri:'certscore://connection'});
      const diagnostics = JSON.parse(connection.contents[0].text);
      assert.equal(diagnostics.authenticated, true);
      assert.equal(diagnostics.diagnostics.mode, 'hosted_oauth');
      assert.equal(diagnostics.diagnostics.workspaceAccess, 'active');
      assert.equal(typeof diagnostics.diagnostics.quota.hourlyRemaining, 'number');
      const prompts = await rpc('prompts/list', {});
      assert.equal(prompts.prompts.length,3);
      for (const uri of ['certscore://project-instructions','certscore://reconnect','certscore://example-report']) {
        const resource=await rpc('resources/read',{uri});
        assert.ok(resource.contents[0].text.length>0);
        if(uri==='certscore://example-report') assert.equal(JSON.parse(resource.contents[0].text).example,true);
      }
      for (const [name,args] of [['certscore_launch_review',{url:'https://ergoveritas.com'}],['certscore_remediation_checklist',{scanId}]] as const) {
        const prompt=await rpc('prompts/get',{name,arguments:args});assert.ok(prompt.messages[0].content.text.length>0);
      }
      const compare = await rpc('prompts/get', {name:'certscore_compare_scans',arguments:{beforeScanId:scanId,afterScanId:scanId}});
      assert.match(compare.messages[0].content.text,/do not start a new scan/);

      const {certScoreMcpToolContracts}=await import('@certscore/api-contracts');
      const advertised=await rpc('tools/list',{});
      assert.equal(advertised.tools.length,14);
      const cases:Array<[string,Record<string,unknown>]>=[
        ['certscore_get_connection_status',{}],
        ['certscore_get_report_evidence_page',{scanId}],
        ['certscore_scan_site',{url:'https://ergoveritas.com/.well-known/certscore-canary/sentinels/broad-baseline.html',freshness:'latest',scanFrom:'eu_ie'}],
        ['certscore_get_scan',{scanId}],
        ['certscore_get_scan_status',{scanId}],
        ['certscore_get_report',{scanId,detail:'summary',format:'json'}],
        ['certscore_get_evidence',{scanId}],
        ['certscore_get_scan_bundle',{scanId}],
        ['certscore_export_findings',{scanId}],
        ['certscore_list_findings',{scanId,limit:5,offset:0}],
        ['certscore_get_pre_consent_cookies_trackers',{scanId,maxRows:5}],
        ['certscore_explain_finding',{scanId}],
        ['certscore_get_latest_domain_scan',{domain:'ergoveritas.com',scanFrom:'eu_ie'}],
        ['certscore_get_latest_domain_pre_consent_cookies_trackers',{domain:'ergoveritas.com',scanFrom:'eu_ie',maxRows:5}]
      ];
      let findingId:string|undefined;
      const failures:string[]=[];
      for(const [name,args] of cases){
        const started=Date.now();
        try {
          if(name==='certscore_explain_finding'){assert.ok(findingId,'prior list must return a real finding');args.findingId=findingId;}
          const result=await rpc('tools/call',{name,arguments:args});
          const contract=certScoreMcpToolContracts.find(c=>c.name===name)!;
          const parsed=contract.outputSchema.safeParse(result.structuredContent);
          assert.ok(parsed.success,JSON.stringify(parsed.success?[]:parsed.error.issues.map(i=>({path:i.path,code:i.code}))));
          assert.ok(result.content.some((c:any)=>c.type==='text'&&c.text.length>0),'text result required');
          const guidance=result._meta?.['ai.certscore/responseGuidance'];
          assert.equal(guidance?.tool,name,'response guidance must identify this tool');
          assert.equal(guidance?.version,'certscore.mcp-response-guidance.v1');
          assert.ok(guidance.nextAction?.instruction,'actionable guidance required');
          assert.ok(guidance.purpose?.length > 20,'tool purpose guidance required');
          console.info(JSON.stringify({responseOverheadTool:name,compactBytes:Buffer.byteLength(result.content.at(-1).text),fullMetadataBytes:Buffer.byteLength(JSON.stringify(guidance))}));
          if(name==='certscore_list_findings'){findingId=result.structuredContent.findings[0]?.id;assert.ok(result.structuredContent.findings.length<=5);}
          if(args.scanId)assert.equal(result.structuredContent.scanId,scanId);
          if(name==='certscore_explain_finding')assert.equal(result.structuredContent.id,findingId);
          if(name==='certscore_get_latest_domain_scan'){
            assert.equal(result.structuredContent.domain,'ergoveritas.com');
            assert.ok(result.structuredContent.scan,'domain lookup must return a retained scan');
            assert.equal(result.structuredContent.scan.scanId,scanId);
          }
          if(name.includes('pre_consent_cookies_trackers'))assert.ok(result.structuredContent.rows.length<=5);
          if(['certscore_get_scan','certscore_get_scan_status','certscore_get_scan_bundle'].includes(name))assert.equal(result.structuredContent.status,'completed');

          console.log(JSON.stringify({tool:name,pass:true,durationMs:Date.now()-started,scanId:result.structuredContent.scanId??result.structuredContent.scan?.scanId,status:result.structuredContent.status,reused:result.structuredContent.reused}));
        }catch(error){failures.push(name+': '+String(error));console.log(JSON.stringify({tool:name,pass:false,error:String(error)}));}
      }
      assert.deepEqual(failures,[]);
    } else {
    for(const name of ['certscore_get_scan_status','certscore_get_scan_bundle']){const result=await rpc('tools/call',{name,arguments:{scanId}});assert.equal(result.structuredContent.scanId,scanId);}
    }

    const refreshed=await token({grant_type:'refresh_token',refresh_token:original.refresh_token});assert.notEqual(refreshed.access_token,access);assert.equal(refreshed.scope,original.scope);access=refreshed.access_token;
    for(const name of ['certscore_get_scan_status','certscore_get_scan_bundle']){const result=await rpc('tools/call',{name,arguments:{scanId}});assert.equal(result.structuredContent.scanId,scanId);assert.equal(session,firstSession);}
    console.log(JSON.stringify({gate:'local-real-oauth-refresh',scanId,tokenExchange:true,status:true,bundle:true,refresh:true,sameSession:true}));
  }finally{
    if(session&&access)await fetch(origin+'/mcp',{method:'DELETE',headers:{authorization:'Bearer '+access,'mcp-session-id':session,'mcp-protocol-version':'2025-11-25'}});
    await db.query('delete from mcp_oauth_authorization_codes where code_hash=$1',[hash(code)]);
    if(hashes.length)await db.query('delete from mcp_oauth_refresh_tokens where token_hash=any($1::text[])',[hashes]);
    await db.getReadPool().end();await db.getWritePool().end();
  }
});

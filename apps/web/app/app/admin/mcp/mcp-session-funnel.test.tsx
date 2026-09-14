import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
// Shared UI sources use the classic JSX transform in the Node test runner.
Object.assign(globalThis, { React });
import { renderToStaticMarkup } from 'react-dom/server';
import { McpSessionFunnel, funnelRate } from './mcp-session-funnel';
import type { McpFunnelSession } from '../../../../lib/admin/mcp-funnel';
const session:McpFunnelSession={session_id:'session',client_name:'<script>test</script>',surface:'mcp_light',source:'unknown',initialized_at:'2026-09-08T00:00:00Z',mature:true,listed:false,calls:3,attempted:true,admitted:true,new_scan:true,reused:false,delivered:true,any_result:true,errors:0,quota_hits:0,status_calls:1,admitted_scans:1,truncation_known:0,truncated:0,purpose:'tracking_check',integration:JSON.stringify(['plugin','1','r1']),partial:true,no_go:false};
test('funnel excludes pending sessions from rates and renders scope, sampling and metadata coverage honestly',()=>{
  const html=renderToStaticMarkup(<McpSessionFunnel data={{sessions:[session,{...session,session_id:'pending',mature:false}],total_sessions:6000,outside_cohort_calls:4,missing_session_calls:1,as_of:'2026-09-08T01:00:00Z'}} followUpMinutes={30} params={{tab:'workflows',traffic:'external',timeSpan:'6h',q:'needle',purpose:'tracking_check'}}/>);
  assert.match(html,/1 recent sessions are pending/);
  assert.match(html,/1\/1 · 100.0%/);
  assert.match(html,/All funnel counts and rates describe this sample/);
  assert.match(html,/workflow text\/purpose filters below do not narrow this funnel/);
  assert.match(html,/plugin @ 1 · skill r1/);
  assert.match(html,/not recorded/);
  assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
test('a zero denominator is unknown, not zero percent conversion',()=>{
  assert.equal(funnelRate(0,0),'— (no eligible sessions)');
  assert.equal(funnelRate(0,3),'0/3 · 0.0%');
});
test('per-scan retrieval rates exclude pending pairs and show missing results without claiming abandonment',()=>{
  const base={session_id:'s',completed_at:'2026-09-08T00:00:00Z',mature:true,new_scan:true};
  const html=renderToStaticMarkup(<McpSessionFunnel data={{sessions:[],total_sessions:0,outside_cohort_calls:0,missing_session_calls:0,as_of:'2026-09-08T01:00:00Z',connected_accounts:2,caller_bindings:3,
    delivery_total:3,delivery_scans:[{...base,scan_id:'one',retrieved:true},{...base,scan_id:'two',retrieved:false},{...base,scan_id:'pending',retrieved:false,mature:false}]}} followUpMinutes={30} params={{traffic:'external',timeSpan:'24h'}}/>);
  assert.match(html,/1\/2 · 50.0%/);
  assert.match(html,/1 without a recorded retrieval/);
  assert.match(html,/not confirmed client receipt/);
  assert.match(html,/2 account-linked connections/);
  assert.match(html,/\/app\/scans\/two/);
  assert.doesNotMatch(html,/\/app\/scans\/pending/);
});

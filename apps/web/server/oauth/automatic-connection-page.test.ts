import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Exercise the real server page with isolated auth/DB boundaries: no credentials,
// production grants, or authorization codes are created by these tests.
test('authorization page automatically connects only after its existing validation gates', async () => {
  const pagePath = fileURLToPath(new URL('../../app/oauth/authorize/page.tsx', import.meta.url));
  const mocks: Record<string, string> = {
    state: `export const state = { signedIn: true, registered: true, invalid: [], denied: [], calls: [] };`,
    navigation: `export function redirect(url) { throw Object.assign(new Error('redirect'), {url}); }`,
    auth: `import {state} from 'test-state'; export async function getCurrentUser(){return state.signedIn ? {id:'session-user'} : null;}`,
    bootstrap: `export async function bootstrapAppUserSession(){return {organization:{id:'session-workspace'},user:{id:'session-user'}};}`,
    oauth: `import {state} from 'test-state';
      export async function getMcpOAuthClient(){return state.registered ? {clientName:'Test'} : null;}
      export function redirectUriAllowed(c,u){return u==='https://client.example/callback';}
      export async function resolveMcpOAuthRequestedScopes(){return {approvedScopes:['scan:read','scan:create','mcp'], invalidScopes:state.invalid, deniedScopes:state.denied};}
      export async function createAuthorizationCode(input){state.calls.push(input);return 'test-code';}`,
    event: `export async function recordMcpOAuthAuthorization(){}` ,
    scopes: `export function oauthScopeString(scopes){return scopes.join(' ');}`,
    jsx: `export function jsx(type,props){return {type,props}}; export const jsxs=jsx;`,
    ui: `export const Card='card',CardContent='content',CardHeader='header',CardTitle='title';export default 'link';`,
  };
  const result = await build({
    stdin: {contents: `export {default as page} from ${JSON.stringify(pagePath)};export {state} from 'test-state';`, resolveDir: process.cwd()},
    bundle:true, write:false, format:'esm', platform:'node', jsx:'automatic',
    plugins:[{name:'isolated-page',setup(api){
      api.onResolve({filter:/.*/}, args => {
        let key = args.path === 'test-state' ? 'state' : args.path === 'next/navigation' ? 'navigation'
          : args.path.endsWith('/server/auth') ? 'auth' : args.path.endsWith('/server/bootstrap-user') ? 'bootstrap'
          : args.path.endsWith('/server/oauth/mcp-oauth-authorization-event') ? 'event' : args.path.endsWith('/server/oauth/mcp-oauth') ? 'oauth' : args.path === '@certscore/mcp-auth' ? 'scopes'
          : args.path === 'react/jsx-runtime' ? 'jsx' : ['next/link','@website-signal-risk-scanner/ui'].includes(args.path) ? 'ui' : null;
        return key ? {path:key,namespace:'mock'} : undefined;
      });
      api.onLoad({filter:/.*/,namespace:'mock'}, args=>({contents:mocks[args.path],loader:'js'}));
    }}],
  });
  const {page,state} = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0]!.text).toString('base64')}`);
  const params = {response_type:'code',client_id:'registered-client',redirect_uri:'https://client.example/callback',code_challenge:'a'.repeat(43),code_challenge_method:'S256',state:'caller-state',scope:'scan:read scan:create mcp',organization_id:'untrusted-workspace',owner_user_id:'untrusted-user'};
  for (const prompt of [undefined,'consent']) {
    await assert.rejects(page({searchParams:Promise.resolve({...params,prompt})}), (error:any)=>{
      const target=new URL(error.url);assert.equal(target.origin,'https://client.example');assert.equal(target.searchParams.get('code'),'test-code');assert.equal(target.searchParams.get('state'),'caller-state');return true;
    });
    assert.equal(state.calls.at(-1).organizationId,'session-workspace');
    assert.equal(state.calls.at(-1).ownerUserId,'session-user');
  }
  state.calls=[];state.signedIn=false;
  await assert.rejects(page({searchParams:Promise.resolve(params)}),(error:any)=>error.url.startsWith('/login?next='));
  assert.equal(state.calls.length,0);state.signedIn=true;
  for (const patch of [{redirect_uri:'https://attacker.example'}, {code_challenge_method:'plain'}, {code_challenge:'short'}]) {
    await page({searchParams:Promise.resolve({...params,...patch})});assert.equal(state.calls.length,0);
  }
  state.registered=false;await page({searchParams:Promise.resolve(params)});assert.equal(state.calls.length,0);state.registered=true;
  state.invalid=['unsupported'];await page({searchParams:Promise.resolve(params)});assert.equal(state.calls.length,0);state.invalid=[];
  state.denied=['scan:create'];await page({searchParams:Promise.resolve(params)});assert.equal(state.calls.length,0);
});

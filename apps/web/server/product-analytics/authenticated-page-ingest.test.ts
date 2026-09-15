import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
(require.cache as Record<string, unknown>)[require.resolve("server-only")] = {exports:{},loaded:true};
const {handleOperationalEventPost} = require("./ingest-request") as typeof import("./ingest-request");
import { issueAuthenticatedPageToken } from "./authenticated-page-token";

test("ingestion requires authentication and bound proof, and cannot fabricate server events", async()=>{
  const oldSecret=process.env.BETTER_AUTH_SECRET;
  process.env.BETTER_AUTH_SECRET="test-secret-that-is-at-least-thirty-two-characters";
  const userId="ceadffd9-640c-41ad-a183-65795eed5903";
  const identity={id:"0acbb07b-cd0c-4aca-b2bf-32f0da702c28",userId,path:"/app",requestedAt:Date.now()};
  const token=issueAuthenticatedPageToken(identity,process.env.BETTER_AUTH_SECRET);
  let user:any={id:userId,email:"fixture@example.test"};
  const writes:any[]=[];
  const services={getUser:async()=>user,findOrganization:async()=>null,persist:async(...args:any[])=>{writes.push(args);}};
  const body={eventName:"page_viewed",category:"navigation",feature:"route",outcome:"observed",route:"/app",authenticatedPageToken:token,language:"en",viewportBand:"lg"};
  const request=(value:unknown,headers:Record<string,string>={})=>new Request("https://certscore.ai/api/operational-events",{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify(value)});
  try {
    user=null;
    assert.equal((await handleOperationalEventPost(request(body),services)).status,401);
    user={id:"another-user",email:"fixture@example.test"};
    assert.equal((await handleOperationalEventPost(request(body),services)).status,400);
    user={id:userId,email:"fixture@example.test"};
    assert.equal((await handleOperationalEventPost(request({...body,route:"/app/admin"}),services)).status,400);
    assert.equal((await handleOperationalEventPost(request(body,{"sec-fetch-site":"cross-site"}),services)).status,403);
    for(const feature of ["server_route","server_action","authenticated_page_request","authenticated_page_browser_confirmed"]) {
      assert.equal((await handleOperationalEventPost(request({...body,authenticatedPageToken:undefined,feature}),services)).status,400);
    }
    assert.equal(writes.length,0);
    assert.equal((await handleOperationalEventPost(request(body),services)).status,201);
    assert.deepEqual(writes[0][0],identity);
    assert.equal(writes[0][1].userId,userId);
    assert.equal(writes[0][2],true);
    assert.deepEqual(writes[0][3],{language:"en",viewportBand:"lg"});
    assert.equal((await handleOperationalEventPost(request(body),{...services,persist:async()=>{throw new Error("storage unavailable");}})).status,503);
  }finally{if(oldSecret===undefined)delete process.env.BETTER_AUTH_SECRET;else process.env.BETTER_AUTH_SECRET=oldSecret;}
});

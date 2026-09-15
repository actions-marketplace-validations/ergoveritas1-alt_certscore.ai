/** Local browser -> ingestion handler -> PostgreSQL -> activity details regression. */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {build} from "esbuild";
import {chromium} from "playwright";
import pg from "pg";
import {issueAuthenticatedPageToken} from "../apps/web/server/product-analytics/authenticated-page-token";
import {AUTHENTICATED_PAGE_UPSERT_SQL} from "../apps/web/server/product-analytics/authenticated-page-sql";
import {normalizeAnalyticsRoute,extractScanIdFromPath} from "../apps/web/lib/product-analytics/contract";
const require=createRequire(import.meta.url);
(require.cache as Record<string,unknown>)[require.resolve("server-only")]={exports:{},loaded:true};
const {handleOperationalEventPost}=require("../apps/web/server/product-analytics/ingest-request") as typeof import("../apps/web/server/product-analytics/ingest-request");

async function main(){
 const url=process.env.PUBLIC_PAGE_TEST_DATABASE_URL!;
 assert.equal(new URL(url).hostname,"127.0.0.1");
 const db=new pg.Client({connectionString:url});await db.connect();
 const userId=randomUUID(),id=randomUUID();
 process.env.BETTER_AUTH_SECRET="a-local-browser-test-secret-at-least-32-characters";
 const identity={id,userId,path:"/app",requestedAt:Date.now()};
 const token=issueAuthenticatedPageToken(identity,process.env.BETTER_AUTH_SECRET);
 let requests=0;
 const sql=AUTHENTICATED_PAGE_UPSERT_SQL.replaceAll("public.","pg_temp.");
 const services={
  getUser:async()=>({id:userId,email:"fixture@example.test"} as any),findOrganization:async()=>null,
  persist:async(i:any,c:any,confirmed:boolean,d:any={})=>{
   const result=await db.query(sql,[i.id,i.requestedAt,normalizeAnalyticsRoute(i.path),i.path,i.userId,null,extractScanIdFromPath(i.path)??null,confirmed,false,c.browserFamily,c.osFamily,c.deviceClass,c.isBot,d.language??null,d.viewportBand??null,c.countryCode]);
   assert.equal(result.rowCount,1);
  },
 };
 let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
 const server=createServer(async(req,res)=>{
  try{
   const route=new URL(req.url!,"http://localhost");
   if(route.pathname==="/api/operational-events"){
    requests++;const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
    const response=await handleOperationalEventPost(new Request(`http://localhost${route.pathname}`,{method:"POST",headers:{"content-type":"application/json","user-agent":req.headers["user-agent"]??""},body:Buffer.concat(chunks)}),services);
    res.statusCode=response.status;res.end(await response.text());return;
   }
   if(route.pathname==="/fixture-event"){
    res.setHeader("Content-Type","application/json");res.end(JSON.stringify((await db.query("select *,null::text as hostname from pg_temp.product_analytics_events where event_id=$1",[id])).rows[0]));return;
   }
   if(route.pathname==="/fixture.js"){res.setHeader("Content-Type","text/javascript");res.end(bundle.outputFiles[0]!.text);return;}
   res.setHeader("Content-Type","text/html");res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px system-ui;margin:24px;color:#172033}main{max-width:880px}summary,a{color:#0369a1}details{padding:16px;border:1px solid #cbd5e1;border-radius:8px}dl>div{display:grid;grid-template-columns:180px 1fr;margin:6px 0}dd{margin:0;overflow-wrap:anywhere}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>');
  }catch(error){res.statusCode=500;res.end(String(error));}
 });
 let bundle:Awaited<ReturnType<typeof build>>;
 try{
  await db.query("create temp table users(id uuid primary key);create temp table organizations(id uuid primary key);create temp table scans(id uuid primary key)");
  const base=readFileSync("packages/db/migrations/0184_product_analytics.sql","utf8").replace("create table if not exists public.product_analytics_events","create temp table product_analytics_events").replaceAll("public.","pg_temp.");await db.query(base);
  for(const path of ["0185_operational_event_consent.sql","0201_public_page_requests.sql","0202_authenticated_page_context.sql"])await db.query(readFileSync(`packages/db/migrations/${path}`,"utf8").replaceAll("public.","pg_temp."));
  await db.query("insert into pg_temp.users values($1)",[userId]);
  await services.persist(identity,{browserFamily:"chrome",osFamily:"macos",deviceClass:"desktop",isBot:false,countryCode:null},false);
  bundle=await build({stdin:{contents:`import React,{useEffect,useState}from'react';import{createRoot}from'react-dom/client';import{AuthenticatedPageConfirmation}from'./apps/web/components/analytics/authenticated-page-confirmation';import{UserActivityEventDetails}from'./apps/web/components/admin/user-activity-event-details';import{activityActionLabel}from'./apps/web/lib/admin/user-activity-presentation';function App(){const[e,setE]=useState(null);const refresh=async()=>setE(await(await fetch('/fixture-event')).json());window.refreshEvent=refresh;useEffect(()=>{refresh()},[]);return <><h1>User activity fixture</h1><AuthenticatedPageConfirmation path="/app" token=${JSON.stringify(token)}/>{e&&<><h2>{activityActionLabel(e)}</h2><UserActivityEventDetails event={e}/></>}</>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:false,platform:"browser",jsx:"automatic",tsconfig:"tsconfig.base.json",define:{"process.env.NODE_ENV":"'development'"},plugins:[{name:"local-next-fixture",setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},args=>({path:args.path,namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="next/navigation"?"export function usePathname(){return window.location.pathname}":"import React from 'react';export default function Link({href,children,prefetch,...rest}){return <a href={href} {...rest}>{children}</a>}",loader:"jsx",resolveDir:process.cwd()}));}}]});
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));const address=server.address();assert.ok(address&&typeof address!=="string");const origin=`http://127.0.0.1:${address.port}`;
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript({content: 'window.fixtureVisibility="hidden"; Object.defineProperty(document,"visibilityState",{get:function(){return window.fixtureVisibility;}});'});
  await page.goto(`${origin}/app?private=value`);await page.getByRole("heading",{name:"Page requested",exact:true}).waitFor();assert.equal(requests,0);
  await Promise.all([page.waitForResponse(r=>r.url().includes("/api/operational-events")),page.evaluate(()=>{(window as any).fixtureVisibility="visible";document.dispatchEvent(new Event("visibilitychange"));})]);
  await page.evaluate(()=> (window as any).refreshEvent());await page.getByRole("heading",{name:"Browser-confirmed view",exact:true}).waitFor();assert.equal(requests,1);
  await page.getByText("Details",{exact:true}).click();await page.getByRole("link",{name:"https://certscore.ai/app",exact:true}).waitFor();assert.equal(await page.getByText(/private=value/).count(),0);
  await page.screenshot({path:"/tmp/certscore-activity-details.png",fullPage:true});
  await page.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));await page.waitForLoadState("networkidle");assert.equal(requests,1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:"/tmp/certscore-activity-details-mobile.png",fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await page.goto(`${origin}/app/settings`);await page.getByRole("heading",{name:"Browser-confirmed view",exact:true}).waitFor();await page.evaluate(()=>{(window as any).fixtureVisibility="visible";document.dispatchEvent(new Event("visibilitychange"));});await page.waitForLoadState("networkidle");assert.equal(requests,1,"Reused proof must not confirm a different route");
  assert.equal((await db.query("select count(*) from pg_temp.product_analytics_events")).rows[0].count,"1");assert.deepEqual(errors,[]);
  console.log("PASS: visible-page confirmation -> authenticated ingestion -> one PostgreSQL row -> detailed links; hidden/different-route protection, redaction, desktop/mobile rendering.");
 }finally{await browser?.close();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await db.end();}
}
void main().catch(error=>{console.error(error);process.exitCode=1;});

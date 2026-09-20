import assert from "node:assert/strict";
import test from "node:test";
import { trackProductEvent } from "./client";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "../analytics/consent";

test("public request confirmation never creates browser identity regardless of consent", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalFetch = globalThis.fetch;
  try {
    for (const choice of [null, "granted", "denied"]) {
      let body: Record<string, unknown> | undefined;
      const forbiddenStorage = () => { throw new Error("Public page confirmation must not access tracking storage"); };
      Object.defineProperty(globalThis, "window", { configurable: true, value: {
        localStorage: { getItem: (key: string) => key === ANALYTICS_CONSENT_STORAGE_KEY ? choice : forbiddenStorage(), setItem: forbiddenStorage },
        sessionStorage: { getItem: forbiddenStorage, setItem: forbiddenStorage },
        location: { pathname: "/developers", search: "?utm_source=test" }, innerWidth: 1200,
      } });
      Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "en" } });
      globalThis.fetch = async (_url, init) => { body = JSON.parse(String(init?.body)); return new Response(null, { status: 201 }); };
      trackProductEvent({ eventName: "page_viewed", category: "navigation", feature: "route", outcome: "observed", pageRequestToken: "server-issued-proof" });
      assert.ok(body);
      assert.equal(body.pageRequestToken, "server-issued-proof");
      for (const key of ["actorId", "sessionId", "campaignSource", "scanId"]) assert.equal(body[key], undefined);
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else Reflect.deleteProperty(globalThis, "navigator");
    globalThis.fetch = originalFetch;
  }
});

test("declined analytics still delivers scan IDs for authenticated app activity without browser tracking IDs", async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalFetch = globalThis.fetch;
  const scanId = "bbbfc77a-a9b2-48a2-8afe-e5f0b1f2eb1c";
  const requests: Array<{ body: Record<string, unknown>; headers: Record<string, string> }> = [];
  let writes = 0;
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: (key: string) => key === ANALYTICS_CONSENT_STORAGE_KEY ? "denied" : null, setItem: () => { writes++; } },
    location: { pathname: `/app/scans/${scanId}`, search: "?utm_source=secret" }, innerWidth: 1200,
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "de" } });
  globalThis.fetch = async (_url, init) => {
    requests.push({ body: JSON.parse(String(init?.body)), headers: init?.headers as Record<string, string> });
    return new Response(null, { status: 201 });
  };
  try {
    trackProductEvent({ eventName: "scan_viewed", category: "scan", feature: "route", outcome: "observed" });
    trackProductEvent({ eventName: "page_viewed", category: "navigation", feature: "route", outcome: "observed", route: `/scans/${scanId}` });
    assert.equal(requests[0]?.body.scanId, scanId);
    assert.equal(requests[0]?.headers["x-certscore-analytics-consent"], "denied");
    assert.ok(requests[0]?.body.eventId);
    assert.equal(requests[1]?.body.scanId, undefined);
    for (const key of ["actorId", "sessionId", "campaignSource"]) assert.equal(requests[0]?.body[key], undefined);
    assert.equal(writes, 0);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else Reflect.deleteProperty(globalThis, "navigator");
    globalThis.fetch = originalFetch;
  }
});


test("delivery retries reuse the original event UUID and body", async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalFetch = globalThis.fetch;
  const bodies: string[] = [];
  let delivered!: () => void;
  const complete = new Promise<void>((resolve) => { delivered = resolve; });
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: () => "denied" },
    location: { pathname: "/app", search: "" }, innerWidth: 1200,
    setTimeout: (callback: () => void) => { callback(); return 0; },
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "en" } });
  globalThis.fetch = async (_url, init) => {
    bodies.push(String(init?.body));
    if (bodies.length === 1) return new Response(null, { status: 503 });
    delivered();
    return new Response(null, { status: 201 });
  };
  try {
    trackProductEvent({ eventName: "action_clicked", category: "interaction", feature: "ui_control", outcome: "observed" });
    await complete;
    assert.equal(bodies.length, 2);
    assert.equal(bodies[0], bodies[1]);
    assert.match(JSON.parse(bodies[0]!).eventId, /^[0-9a-f-]{36}$/);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else Reflect.deleteProperty(globalThis, "navigator");
    globalThis.fetch = originalFetch;
  }
});

test("authenticated proof confirmation uses existing retry transport without creating tracking identities", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis,"window");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis,"navigator");
  const originalFetch = globalThis.fetch;
  let payload: Record<string,unknown> | undefined;
  const forbidden = () => { throw new Error("Tracking storage accessed"); };
  Object.defineProperty(globalThis,"window",{configurable:true,value:{
    localStorage:{getItem:(key:string)=>key===ANALYTICS_CONSENT_STORAGE_KEY?"granted":forbidden(),setItem:forbidden},
    sessionStorage:{getItem:forbidden,setItem:forbidden},location:{pathname:"/app",search:"?secret=value"},innerWidth:1200,
  }});
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{language:"en"}});
  globalThis.fetch=async(_url,init)=>{payload=JSON.parse(String(init?.body));return new Response(null,{status:201});};
  try {
    trackProductEvent({eventName:"page_viewed",category:"navigation",feature:"route",outcome:"observed",authenticatedPageToken:"a1.signed-proof"});
    assert.equal(payload?.authenticatedPageToken,"a1.signed-proof");
    for(const key of ["actorId","sessionId","campaignSource"]) assert.equal(payload?.[key],undefined);
  } finally {
    if(originalWindow)Object.defineProperty(globalThis,"window",originalWindow);else Reflect.deleteProperty(globalThis,"window");
    if(originalNavigator)Object.defineProperty(globalThis,"navigator",originalNavigator);else Reflect.deleteProperty(globalThis,"navigator");
    globalThis.fetch=originalFetch;
  }
});

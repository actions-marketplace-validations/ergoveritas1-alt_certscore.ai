import assert from "node:assert/strict";
import test from "node:test";
import { isRecognizedSessionCookieName } from "./middleware";

test("recognizes Better Auth session cookie names", () => {
  assert.equal(isRecognizedSessionCookieName("session_token"), true);
  assert.equal(isRecognizedSessionCookieName("__Secure-session_token"), true);
  assert.equal(isRecognizedSessionCookieName("certscore.session_token"), true);
  assert.equal(isRecognizedSessionCookieName("__Secure-certscore.session_token"), true);
  assert.equal(isRecognizedSessionCookieName("certscore_session"), true);
});

test("rejects unrelated cookies", () => {
  assert.equal(isRecognizedSessionCookieName("session_data"), false);
  assert.equal(isRecognizedSessionCookieName("__Secure-session_data"), false);
  assert.equal(isRecognizedSessionCookieName("csrf_token"), false);
});

import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { BROWSER_WORKSPACE_COOKIE } from "./lib/marketplace-browser-navigation";

test("ordinary login and app entry remove stale Marketplace selection before rendering", async () => {
  for (const path of ["/login", "/app", "/app/", "/app/admin/scans", "/app/settings", "/app/scans"]) {
    const request = new NextRequest(`https://certscore.ai${path}`, {headers: {
      cookie: `certscore.session_token=fixture; ${BROWSER_WORKSPACE_COOKIE}=3fcc7798-18f4-4948-a835-b1789f0cbe6d; certscore_marketplace_browser_claim=claim`,
    }});
    const response = await middleware(request, {} as any);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("location"), null, path);
    const forwarded = response.headers.get("x-middleware-request-cookie") ?? "";
    assert.ok(!forwarded.includes(BROWSER_WORKSPACE_COOKIE), path);
    assert.ok(forwarded.includes("certscore.session_token=fixture"), path);
    assert.ok(forwarded.includes("certscore_marketplace_browser_claim=claim"), path);
    assert.equal(response.cookies.get(BROWSER_WORKSPACE_COOKIE)?.value, "", path);
  }
});

test("Marketplace hub and direct reports keep selection; prefetch cannot clear the browser selection", async () => {
  for (const path of ["/marketplace/browser", "/app/scans/9f2b9aca-88cd-4e6b-8dd9-71fb97bb2ac0"]) {
    const response = await middleware(new NextRequest(`https://certscore.ai${path}`, {headers: {
      cookie: `certscore.session_token=fixture; ${BROWSER_WORKSPACE_COOKIE}=selected`,
    }}), {} as any);
    assert.ok(response.headers.get("x-middleware-request-cookie")?.includes(`${BROWSER_WORKSPACE_COOKIE}=selected`));
    assert.equal(response.cookies.get(BROWSER_WORKSPACE_COOKIE), undefined);
  }
  const response = await middleware(new NextRequest("https://certscore.ai/app", {headers: {
    cookie: `certscore.session_token=fixture; ${BROWSER_WORKSPACE_COOKIE}=selected`, "next-router-prefetch":"1",
  }}), {} as any);
  assert.equal(response.cookies.get(BROWSER_WORKSPACE_COOKIE), undefined);
  assert.ok(!response.headers.get("x-middleware-request-cookie")?.includes(BROWSER_WORKSPACE_COOKIE));
});
test("authenticated document identities exclude RSC/prefetch and overwrite forged headers", async () => {
  for (const extra of ([{}, {rsc:"1"}, {"next-router-prefetch":"1"}, {purpose:"prefetch"}, {"sec-purpose":"prefetch;prerender"}] as Record<string,string>[])) {
    const request = new NextRequest("https://certscore.ai/app", {headers:{cookie:"certscore.session_token=fixture", accept:"text/html", "x-certscore-operational-event-id":"forged", ...extra}});
    const response = await middleware(request, {} as any);
    const eventId = response.headers.get("x-middleware-request-x-certscore-operational-event-id");
    if (Object.keys(extra).length) assert.equal(eventId,null);
    else assert.match(eventId!, /^[0-9a-f-]{36}$/);
  }
});

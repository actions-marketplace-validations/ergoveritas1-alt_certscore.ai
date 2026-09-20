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
test("authenticated document identities exclude RSC/prefetch and overwrite forged headers", async () => {
  for (const extra of ([{}, {rsc:"1"}, {"next-router-prefetch":"1"}, {purpose:"prefetch"}, {"sec-purpose":"prefetch;prerender"}] as Record<string,string>[])) {
    const request = new NextRequest("https://certscore.ai/app", {headers:{cookie:"certscore.session_token=fixture", accept:"text/html", "x-certscore-operational-event-id":"forged", ...extra}});
    const response = await middleware(request, {} as any);
    const eventId = response.headers.get("x-middleware-request-x-certscore-operational-event-id");
    if (Object.keys(extra).length) assert.equal(eventId,null);
    else assert.match(eventId!, /^[0-9a-f-]{36}$/);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { isPublicDocumentRequest, pageRequestTokenFromNavigation, PUBLIC_PAGE_TIMING_NAME } from "./public-page-request";
import { issuePublicPageToken, verifyPublicPageToken } from "../../server/product-analytics/public-page-token";

const secret = "public-page-test-secret-not-a-real-auth-secret";

test("public documents are captured with every consent state, excluding assets, APIs and prefetches", () => {
  for (const cookie of ["", "analytics=denied", "analytics=granted"]) {
    assert.ok(isPublicDocumentRequest("GET", "/", new Headers({ accept: "text/html", cookie })));
    assert.ok(isPublicDocumentRequest("GET", "/developers/mcp", new Headers({ "sec-fetch-dest": "document", cookie })));
    assert.ok(isPublicDocumentRequest("GET", "/mcp/light", new Headers({ accept: "text/html" })));
  }
  for (const route of ["/app", "/app/scans/123", "/api/operational-events", "/_next/static/chunk.js", "/icon.svg", "/mcp", "/.well-known/test"]) {
    assert.equal(isPublicDocumentRequest("GET", route, new Headers({ accept: "text/html" })), false, route);
  }
  const excludedHeaders: Record<string, string>[] = [
    { rsc: "1" }, { "next-router-prefetch": "1" }, { "next-router-segment-prefetch": "/" },
    { purpose: "prefetch" }, { "sec-purpose": "prefetch;prerender" }, { "sec-fetch-dest": "script" },
  ];
  for (const headers of excludedHeaders) assert.equal(isPublicDocumentRequest("GET", "/", new Headers({ accept: "text/html", ...headers })), false);
  assert.equal(isPublicDocumentRequest("POST", "/", new Headers({ accept: "text/html" })), false);
  assert.equal(isPublicDocumentRequest("HEAD", "/", new Headers({ accept: "text/html" })), false);
});

test("request proof binds ID, normalized route and time, without raw query values", () => {
  const now = 1_800_000_000_000;
  const { identity, token } = issuePublicPageToken("/developers?email=secret@example.com", secret, now);
  assert.equal(identity.route, "/developers");
  assert.ok(!token.includes("secret"));
  assert.deepEqual(verifyPublicPageToken(token, "/developers", secret, now), identity);
  assert.equal(verifyPublicPageToken(token, "/other", secret, now), null);
  assert.equal(verifyPublicPageToken(token, "/app", secret, now), null);
  assert.equal(verifyPublicPageToken(token, "/developers", "different-secret-with-at-least-32-chars", now), null);
  assert.equal(verifyPublicPageToken(token, "/developers", secret, now + 86_400_001), null);
  assert.equal(verifyPublicPageToken(token, "/developers", secret, now - 5_001), null);
  assert.equal(verifyPublicPageToken(token.replace("v1.", "v2."), "/developers", secret, now), null);
  assert.notEqual(issuePublicPageToken("/developers", secret, now).identity.id, identity.id);
});

test("domain-bearing public Pulse routes are documents and retain only normalized paths", () => {
  for (const route of ["/pulse/example.com", "/pulse/subdomain.example.co.uk", "/pulse/example.ai", "/pulse/example.zip"]) {
    assert.ok(isPublicDocumentRequest("GET", route, new Headers({ "sec-fetch-dest": "document" })));
    const { token, identity } = issuePublicPageToken(route, secret);
    assert.equal(identity.route, "/pulse/:site");
    assert.deepEqual(verifyPublicPageToken(token, route, secret), identity);
  }
  for (const route of ["/logo.png", "/download.pdf", "/assets/font.woff2", "/robots.txt"]) {
    assert.equal(isPublicDocumentRequest("GET", route, new Headers({ accept: "text/html" })), false);
  }
});

test("navigation correlation fails closed for unavailable metadata and a different document", () => {
  const { token } = issuePublicPageToken("/developers", secret);
  const navigation = { name: "https://certscore.ai/developers", serverTiming: [{ name: PUBLIC_PAGE_TIMING_NAME, description: token }] };
  assert.equal(pageRequestTokenFromNavigation("/developers", navigation), token);
  assert.equal(pageRequestTokenFromNavigation("/trust", navigation), undefined);
  assert.equal(pageRequestTokenFromNavigation("/developers", { name: navigation.name }), undefined);
  assert.equal(pageRequestTokenFromNavigation("/developers"), undefined);
});

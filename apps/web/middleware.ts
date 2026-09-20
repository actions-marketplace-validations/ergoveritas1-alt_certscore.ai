import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isPublicDocumentRequest, isDocumentNavigation, PUBLIC_PAGE_TIMING_NAME } from "./lib/product-analytics/public-page-request";
import { issuePublicPageToken } from "./server/product-analytics/public-page-token";

const sessionCookieNames = new Set([
  "session_token",
  "__Secure-session_token",
  "certscore.session_token",
  "__Secure-certscore.session_token",
  "certscore_session"
]);

export function isRecognizedSessionCookieName(cookieName: string) {
  return sessionCookieNames.has(cookieName);
}

function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => isRecognizedSessionCookieName(cookie.name));
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  if (pathname !== "/app" && !pathname.startsWith("/app/")) {
    const response = NextResponse.next();
    if (process.env.CERTSCORE_PUBLIC_PAGE_REQUEST_LOGGING_ENABLED === "0"
      || !isPublicDocumentRequest(request.method, pathname, request.headers)) return response;
    try {
      const { identity, token } = issuePublicPageToken(pathname, process.env.BETTER_AUTH_SECRET ?? "");
      // Per-response metadata, never embedded in cached HTML or stored in cookies.
      response.headers.append("Server-Timing", `${PUBLIC_PAGE_TIMING_NAME};desc="${token}"`);
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
      event.waitUntil(import("./server/product-analytics/public-page-repository")
        .then(({ persistPublicPageRequest }) => persistPublicPageRequest(identity, false, request.headers.get("user-agent") ?? ""))
        .catch(() => { console.error(JSON.stringify({ event: "public_page_request.write_failed" })); }));
    } catch {
      console.error(JSON.stringify({ event: "public_page_request.configuration_failed" }));
    }
    return response;
  }
  if (hasSessionCookie(request)) {
    const requestHeaders = new Headers(request.headers);
    // Only real document requests receive server page identities. Soft navigation
    // is observed by the browser tracker; prefetch/RSC requests are not visits.
    requestHeaders.delete("x-certscore-operational-event-id");
    requestHeaders.delete("x-certscore-operational-requested-at");
    if (request.method === "POST" || isDocumentNavigation(request.method, request.headers)) {
      requestHeaders.set("x-certscore-operational-event-id", crypto.randomUUID());
      requestHeaders.set("x-certscore-operational-requested-at", String(Date.now()));
    }
    requestHeaders.set("x-certscore-operational-method", request.method);
    requestHeaders.set("x-certscore-operational-route", request.nextUrl.pathname);
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|mcp/?$|\\.well-known(?:/|$)).*)"]
};

import { verifyAuthenticatedPageToken } from "./authenticated-page-token";
import { persistAuthenticatedPageRequest } from "./authenticated-page-repository";
import { classifyUserAgent, requestTechnicalContext } from "./technical-context";
import { resolveActivityAttribution } from "../../lib/product-analytics/operational-activity";
import { NextResponse } from "next/server";
import { isPlatformAdminEmail } from "../admin/platform-admin";
import { getBetterAuthSessionUser } from "../better-auth/session";
import { parseProductAnalyticsPayload } from "../../lib/product-analytics/contract";
import { findOrganizationIdForUser, persistProductAnalyticsEvent } from "./repository";
import { verifyPublicPageToken } from "./public-page-token";
import { persistPublicPageRequest } from "./public-page-repository";
import { isPublicPagePath, PUBLIC_PAGE_CONFIRMED_FEATURE, PUBLIC_PAGE_REQUEST_FEATURE, PUBLIC_PAGE_UNLINKED_FEATURE } from "../../lib/product-analytics/public-page-request";


function referringDomain(request: Request) {
  const value = request.headers.get("referer");
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === request.headers.get("host") ? null : hostname.slice(0, 253);
  } catch {
    return null;
  }
}

const authenticatedPageServices = {
  getUser: getBetterAuthSessionUser,
  findOrganization: findOrganizationIdForUser,
  persist: persistAuthenticatedPageRequest,
};
export async function handleOperationalEventPost(request: Request, confirmationServices = authenticatedPageServices) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_origin_event" }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  const payload = parseProductAnalyticsPayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: "invalid_event" }, { status: 400 });

  if (payload.authenticatedPageToken) {
    if (payload.pageRequestToken || !payload.pagePath || !["page_viewed", "scan_viewed", "report_viewed"].includes(payload.eventName)) {
      return NextResponse.json({ error: "invalid_page_confirmation" }, { status: 400 });
    }
    try {
      const user = await confirmationServices.getUser();
      if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
      const identity = verifyAuthenticatedPageToken(payload.authenticatedPageToken, payload.pagePath, user.id, process.env.BETTER_AUTH_SECRET ?? "");
      if (!identity) return NextResponse.json({ error: "invalid_page_confirmation" }, { status: 400 });
      await confirmationServices.persist(identity, {
        ...requestTechnicalContext(request.headers),
        userId: user.id, organizationId: await confirmationServices.findOrganization(user.id),
        isStaff: isPlatformAdminEmail(user.email), consentState: "operational", referringDomain: null,
      }, true, { language: payload.language, viewportBand: payload.viewportBand });
      return new NextResponse(null, { status: 201 });
    } catch {
      console.error(JSON.stringify({event: "authenticated_page_confirmation.write_failed"}));
      return NextResponse.json({ error: "event_persistence_failed" }, { status: 503 });
    }
  }

  if (payload.pageRequestToken) {
    const identity = verifyPublicPageToken(payload.pageRequestToken, payload.route, process.env.BETTER_AUTH_SECRET ?? "");
    if (!identity || !["page_viewed", "scan_viewed", "report_viewed"].includes(payload.eventName)) {
      return NextResponse.json({ error: "invalid_page_confirmation" }, { status: 400 });
    }
    try {
      // Do not resolve a session, retain browser identity, or attach this request to an account.
      await persistPublicPageRequest(identity, true, request.headers.get("user-agent") ?? "");
      return new NextResponse(null, { status: 201 });
    } catch {
      console.error(JSON.stringify({ event: "public_page_confirmation.write_failed" }));
      return NextResponse.json({ error: "event_persistence_failed" }, { status: 503 });
    }
  }
  // Request provenance is minted only by middleware, never by arbitrary browser payloads.
  if (payload.eventName === "page_requested" || [PUBLIC_PAGE_REQUEST_FEATURE, PUBLIC_PAGE_CONFIRMED_FEATURE, "authenticated_page_request", "authenticated_page_browser_confirmed", "server_route", "server_action"].includes(payload.feature)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const optionalConsentState = payload.eventName === "analytics_opted_out" || request.headers.get("x-certscore-analytics-consent") === "denied"
    ? "opted_out" as const
    : request.headers.get("x-certscore-analytics-consent") === "granted"
      ? "granted" as const
      : "measurement" as const;
  const userAgent = request.headers.get("user-agent") ?? "";
  const technical = classifyUserAgent(userAgent);
  const countryHeader = request.headers.get("cloudfront-viewer-country") ?? request.headers.get("cf-ipcountry");
  const countryCode = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
  const anonymousInitialView = payload.feature === PUBLIC_PAGE_UNLINKED_FEATURE && isPublicPagePath(payload.route)
    && ["page_viewed", "scan_viewed", "report_viewed"].includes(payload.eventName);
  const retainedPayload = anonymousInitialView ? {
    eventId: payload.eventId, eventName: payload.eventName, category: payload.category,
    feature: payload.feature, outcome: payload.outcome, route: payload.route,
  } : payload;

  try {
    // Actor identity comes only from the authenticated server session.
    const user = anonymousInitialView ? null : await getBetterAuthSessionUser();
    const attribution = resolveActivityAttribution(retainedPayload, user?.id ?? null, optionalConsentState);
    const { operational, consentState } = attribution;
    const organizationId = user ? await findOrganizationIdForUser(user.id).catch(() => null) : null;
    await persistProductAnalyticsEvent(attribution.payload, {
      ...technical,
      consentState,
      countryCode,
      isStaff: isPlatformAdminEmail(user?.email),
      organizationId,
      referringDomain: operational || anonymousInitialView ? null : referringDomain(request),
      userId: attribution.userId
    }, payload.eventId);
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error(JSON.stringify({ event: "product_analytics.write_failed", errorClass: error instanceof Error ? error.name : "UnknownError" }));
    return NextResponse.json({ error: "event_persistence_failed" }, { status: 503 });
  }
}

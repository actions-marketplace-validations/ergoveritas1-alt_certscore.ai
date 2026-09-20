import { normalizeAnalyticsRoute } from "./contract";

export const PUBLIC_PAGE_TIMING_NAME = "certscore_page";
export const PUBLIC_PAGE_REQUEST_FEATURE = "public_page_request";
export const PUBLIC_PAGE_CONFIRMED_FEATURE = "public_page_browser_confirmed";
export const PUBLIC_PAGE_UNLINKED_FEATURE = "initial_browser_view_unlinked";

export function isPublicPagePath(pathname: string) {
  pathname = pathname.split(/[?#]/, 1)[0] ?? "/";
  return !/^\/(?:app|api|_next|\.well-known)(?:\/|$)/i.test(pathname)
    && !/^\/mcp\/?$/i.test(pathname)
    // Domains are route parameters on public Pulse pages, not file extensions.
    && (/^\/pulse\/[^/]+\/?$/.test(pathname)
      || !/\.(?:js|mjs|css|map|json|txt|xml|ico|svg|png|jpe?g|gif|webp|avif|woff2?|ttf|otf|eot|pdf|zip|mp4|webm|mp3|wav)$/i.test(pathname));
}

/** RSC fetches/prefetches are not document views; client navigation is tracked separately. */
export function isPublicDocumentRequest(method: string, pathname: string, headers: Headers) {
  return isPublicPagePath(pathname) && isDocumentNavigation(method, headers);
}

export function isDocumentNavigation(method: string, headers: Headers) {
  return method === "GET" && !headers.has("rsc") && !headers.has("next-router-prefetch")
    && !headers.has("next-router-segment-prefetch")
    && !/prefetch|prerender/i.test(`${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`)
    && (/^(document|iframe)$/.test(headers.get("sec-fetch-dest") ?? "")
      || (!headers.get("sec-fetch-dest") && /text\/html/i.test(headers.get("accept") ?? "")));
}

export function pageRequestTokenFromNavigation(
  pathname: string,
  navigation?: { name: string; serverTiming?: readonly { name: string; description: string }[] },
) {
  if (!navigation) return undefined;
  try {
    if (normalizeAnalyticsRoute(new URL(navigation.name).pathname) !== normalizeAnalyticsRoute(pathname)) return undefined;
  } catch { return undefined; }
  const token = navigation.serverTiming?.find((entry) => entry.name === PUBLIC_PAGE_TIMING_NAME)?.description;
  return token && /^v1\.[0-9a-f-]{36}\.[0-9]{13}\.[0-9a-f]{64}$/.test(token) ? token : undefined;
}

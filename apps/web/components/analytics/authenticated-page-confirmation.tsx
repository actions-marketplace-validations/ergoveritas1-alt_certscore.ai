"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackProductEvent } from "../../lib/product-analytics/client";

/** Per-response proof. Layout reuse/hidden tabs cannot confirm a different page. */
export function AuthenticatedPageConfirmation({ path, token }: {path: string; token: string}) {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);
  useEffect(() => {
    function confirm() {
      if (pathname !== path || window.location.pathname !== path || document.visibilityState !== "visible" || sent.current === token) return;
      sent.current = token;
      trackProductEvent({eventName: "page_viewed", category: "navigation", feature: "route", outcome: "observed", route: path, authenticatedPageToken: token});
    }
    confirm();
    document.addEventListener("visibilitychange", confirm);
    return () => document.removeEventListener("visibilitychange", confirm);
  }, [path, pathname, token]);
  return null;
}

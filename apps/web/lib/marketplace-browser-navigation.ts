export const BROWSER_WORKSPACE_COOKIE = "certscore_marketplace_browser_workspace";

/** Ordinary app entry must never inherit a previous Marketplace selection. */
export function entersOrdinaryWorkspace(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/login/") return true;
  if (pathname !== "/app" && !pathname.startsWith("/app/")) return false;
  // Existing Marketplace reports retain their explicitly selected workspace.
  return !/^\/app\/(?:scans|scanso|scanso2)\/[0-9a-f-]{36}\/?$/i.test(pathname);
}

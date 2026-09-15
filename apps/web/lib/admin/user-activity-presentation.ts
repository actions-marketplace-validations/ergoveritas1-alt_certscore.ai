export type ActivitySourceEvent = { event_name: string; feature: string; browser_family: string; browser_confirmed_at?: string | null };
export function isServerPageRequest(event: ActivitySourceEvent) {
  return event.event_name === "page_requested" || event.feature === "server_route" || event.feature === "authenticated_page_browser_confirmed";
}
export function activityActionLabel(event: ActivitySourceEvent) {
  if (isServerPageRequest(event)) return event.browser_confirmed_at ? "Browser-confirmed view" : "Page requested";
  return event.event_name.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
export function activitySourceLabel(event: ActivitySourceEvent) {
  return isServerPageRequest(event) ? event.browser_confirmed_at ? "Server + browser" : "Server"
    : event.feature === "server_action" || event.browser_family === "server" ? "Server" : "Browser";
}

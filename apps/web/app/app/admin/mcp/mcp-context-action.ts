"use server";

import { loadAdminMcpEventContext } from "../../../../server/admin/mcp-telemetry";
import { adminTrafficScopeVisibility, resolveAdminTrafficScope } from "../../../../lib/admin/admin-traffic-scope";
import { withServerTiming } from "../../../../server/performance/log-server-timing";

export async function loadMcpContext(eventId: string, traffic: string) {
  return withServerTiming("app.admin.mcp.context", () => loadAdminMcpEventContext(eventId,
    adminTrafficScopeVisibility(resolveAdminTrafficScope({ traffic }))));
}

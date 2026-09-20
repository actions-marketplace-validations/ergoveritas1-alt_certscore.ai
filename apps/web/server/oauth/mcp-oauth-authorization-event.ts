import { isPlatformAdminEmail } from "../admin/platform-admin";
import { isClaudeMcpOAuthClientMetadata } from "./mcp-oauth-scopes";
import { persistProductAnalyticsEvent } from "../product-analytics/repository";

export async function recordMcpOAuthAuthorization({ client, sessionUser, organization, user }: {
  client: Parameters<typeof isClaudeMcpOAuthClientMetadata>[0];
  sessionUser: { email?: string | null };
  organization: { id: string };
  user: { id: string };
}) {
  await persistProductAnalyticsEvent({
    category: "account",
    eventName: "oauth_authorized",
    feature: isClaudeMcpOAuthClientMetadata(client) ? "mcp:claude" : "mcp:oauth",
    outcome: "success",
    route: "/oauth/authorize"
  }, {
    browserFamily: "server",
    consentState: "operational",
    countryCode: null,
    deviceClass: "unknown",
    isBot: false,
    isStaff: isPlatformAdminEmail(sessionUser.email),
    osFamily: "server",
    organizationId: organization.id,
    referringDomain: null,
    userId: user.id
  }).catch((error) => {
    console.error(JSON.stringify({
      event: "oauth_authorized.write_failed",
      clientKind: isClaudeMcpOAuthClientMetadata(client) ? "claude" : "other",
      errorClass: error instanceof Error ? error.name : "UnknownError"
    }));
  });
}
